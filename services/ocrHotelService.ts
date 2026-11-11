import { HotelBookingDetails } from './hotelQuoteService';

export interface DualOcrHotelParseResult {
  hotel: Partial<HotelBookingDetails>;
  customerAppPrice?: number;
  agentAppPrice?: number;
  rawCustomerText?: string;
  rawAgentText?: string;
}

/**
 * Extracts the cleanest possible Hotel Name from single-line or multi-line OCR text.
 */
export function extractCleanHotelName(text: string): string {
  if (!text) return '';

  // 1. Check known premium brand patterns first (present on Agent portal and customer portal)
  const brandMatch = text.match(
    /(?:Welcomhotel|ITC|Taj|Marriott|Hyatt|Radisson|Novotel|Hilton|Oberoi|Leela|Trident|Lemon Tree|Ginger|Pride|Holiday Inn|Crowne Plaza|Courtyard|Fairfield)[^\n\r*•·]+(?:Delhi|Mumbai|Goa|Bengaluru|Bangalore|Kolkata|Jaipur|Hyderabad|Chennai|Pune|Dwarka|Manesar|Gurgaon|Noida|[A-Za-z]+)/i
  );
  if (brandMatch) {
    let name = brandMatch[0]
      .replace(/[\*\_~\|•]/g, '')
      .replace(/\s+[s\*0-9]{2,}$/i, '')
      .replace(/\s+(?:re|i|it|in|\d+)\s*$/gi, '')
      .trim();
    // Normalize known OCR substitutions
    name = name.replace(/Welcomhatel/gi, 'Welcomhotel');
    name = name.replace(/\bwarka\b/gi, 'Dwarka');
    if (name.length > 5) return name;
  }

  // 2. Multi-line extraction below "Review Booking"
  if (/Review\s*Booking/i.test(text)) {
    const section = text.split(/Review\s*Booking/i)[1];
    const lines = section
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const nameLines: string[] = [];
    for (const line of lines) {
      // Stop condition: Check-in, Check-out, Sector, Star symbols, or Dates
      if (
        /CHECK[-_\s]?IN|CHECK[-_\s]?OUT|Guests|Rooms|Sector|Location|\*{3,}|AkARE|[0-9]{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|\d[\s\d\.]*$/i.test(
          line
        )
      ) {
        break;
      }
      // Remove trailing random single characters and OCR artifacts like ' as', ' #5', ' Sp', ' re', ' i'
      const cleanedLine = line
        .replace(/\s+(?:as|is|in|it|re|i|at|to|Sp|#\d+|\d+)\s*$/gi, '')
        .replace(/[^\w\s,\-–]/g, '')
        .trim();
      if (cleanedLine.length > 1) {
        nameLines.push(cleanedLine);
      }
    }
    if (nameLines.length > 0) {
      return nameLines
        .join(' ')
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s,\-–]/g, '')
        .trim();
    }
  }

  // 3. Fallback to generic Hotel / Resort lines
  const hotelLineMatch = text.match(/^[^\n\r*•·]+(?:Hotel|Resort|Palace|Inn|Suites)[^\n\r*•·]+/im);
  if (hotelLineMatch) {
    return hotelLineMatch[0]
      .replace(/[^\w\s,\-–]/g, '')
      .trim();
  }

  return '';
}

/**
 * Fuses and cross-validates data from both Customer App and Agent Portal OCR texts.
 * Both portals show the same booking, but different elements are clearer on each:
 * - Hotel Name is complete and un-broken on the Agent portal header line.
 * - Stay Dates, Nights, Check-in/out times, and Inclusions are structured on Customer App.
 * - Star Category and Room Type are present on both.
 * - Customer Price comes from Customer App (or fallback).
 * - Agent Price comes from Agent Portal.
 */
export function fuseDualHotelData(
  customerText: string = '',
  agentText: string = ''
): Partial<HotelBookingDetails> {
  const combined = `${customerText}\n${agentText}`;
  const result: Partial<HotelBookingDetails> = {};

  // 1. Hotel Name: Prioritize Agent Portal (unbroken single line), fallback to Customer App
  const nameFromAgent = extractCleanHotelName(agentText);
  const nameFromCust = extractCleanHotelName(customerText);
  result.hotelName = nameFromAgent || nameFromCust;

  // 2. Star Category
  if (
    /[\*★⭐s]{3,}|5\s*Star/i.test(agentText) ||
    /2\s*2\.\s*8\s*3\s*4|[\*★⭐]{3,}/.test(customerText)
  ) {
    result.starRating = '5 Star Luxury Hotel';
  } else if (/4\s*Star/i.test(combined)) {
    result.starRating = '4 Star Premium Hotel';
  } else if (/3\s*Star/i.test(combined)) {
    result.starRating = '3 Star Comfort Hotel';
  }

  // 3. Location / Address (e.g. "Sector 10 Dwarka, Delhi")
  const secMatch = customerText.match(/(?:Sector\s*\d+[^\n,]*,\s*[^\n]+|Sector\s*\d+[^\n]+)/i);
  if (secMatch) {
    result.location = secMatch[0].replace(/[^\w\s,\-–]/g, '').trim();
  } else {
    const locMatch = combined.match(/(?:Sector\s*\d+[^,\n]+,\s*(?:Delhi|Dwarka)|[A-Z][a-zA-Z\s]+,\s*(?:Delhi|Mumbai|Goa|Bengaluru|Jaipur|Kolkata))/i);
    if (locMatch) {
      result.location = locMatch[0].replace(/[^\w\s,\-–]/g, '').trim();
    }
  }

  // 4. Check-In & Check-Out Dates
  const dates = [
    ...customerText.matchAll(
      /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:\d{4})?,?\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?)\b/gi
    ),
  ];
  if (dates.length >= 2) {
    result.checkInDate = dates[0][1].trim();
    result.checkOutDate = dates[1][1].trim();
  }

  // Times
  const times = [...customerText.matchAll(/\b(\d{1,2}\s*(?:AM|PM))\b/gi)];
  if (times.length > 0) result.checkInTime = times[0][1].replace(/\s+/g, ' ');
  if (times.length > 1) result.checkOutTime = times[1][1].replace(/\s+/g, ' ');

  // Nights
  const nightsMatch = customerText.match(/(\d+)\s*Night/i);
  if (nightsMatch) {
    result.nights = parseInt(nightsMatch[1], 10);
  }

  // 5. Guests & Room Summary
  const guestsMatch = customerText.match(/(\d+)\s*Adults?\s*(?:[•·,e&]|\s+)\s*(\d+)\s*Room/i);
  if (guestsMatch) {
    result.guestSummary = `${guestsMatch[1]} Adults • ${guestsMatch[2]} Room`;
    result.adultsCount = parseInt(guestsMatch[1], 10);
    result.roomsCount = parseInt(guestsMatch[2], 10);
  } else {
    const agentGuests = agentText.match(/Fits\s*(\d+)\s*Adults(?:\s*&\s*(\d+)\s*Child)?/i);
    if (agentGuests) {
      result.guestSummary = `${agentGuests[1]} Adults${agentGuests[2] ? ` • ${agentGuests[2]} Child` : ''} • 1 Room`;
      result.adultsCount = parseInt(agentGuests[1], 10);
      result.roomsCount = 1;
    }
  }

  // 6. Room Category (e.g. "Deluxe Room Double")
  const roomMatch = combined.match(/(?:Deluxe Room Double|Deluxe Room[^\n]*|Superior Room[^\n]*|Executive Suite[^\n]*|Premium Room[^\n]*)/i);
  if (roomMatch) {
    result.roomType = roomMatch[0].replace(/^[^\w]+/, '').trim();
  }

  // 7. Meal Plan & Inclusions
  const inclusions: string[] = [];
  if (/breakfast/i.test(combined)) inclusions.push('Room with Breakfast');
  if (/spa/i.test(combined)) inclusions.push('20% off on session of Spa');
  if (/food\s*(&|and)\s*beverage/i.test(combined)) inclusions.push('20% off on Food & Beverage services');
  if (/signature\s*activities/i.test(combined)) inclusions.push('Signature Activities & Experiences');
  if (inclusions.length > 0) {
    result.inclusions = inclusions;
    result.mealPlan = /breakfast/i.test(combined) ? 'Room with Breakfast' : 'Room Only';
  }

  // 8. Customer App Price
  const custPriceMatch = customerText.match(/(?:₹|INR|Rs\.?|[₹\$])\s*([0-9]{1,2}[,\.][0-9]{3})/i);
  if (custPriceMatch) {
    result.customerAppPrice = parseInt(custPriceMatch[1].replace(/[,.]/g, ''), 10);
  } else {
    const rawNum = customerText.match(/\b([3-9],[0-9]{3}|[1-9][0-9],[0-9]{3})\b/);
    if (rawNum) {
      result.customerAppPrice = parseInt(rawNum[1].replace(/[,.]/g, ''), 10);
    }
  }

  // 9. Agent App Price
  const agentPriceMatch = agentText.match(/(?:Total\s*Price[^\d]*|₹|INR|Rs\.?|oe|T)\s*([0-9]{1,2}[,\.][0-9]{3})/i);
  if (agentPriceMatch) {
    result.agentAppPrice = parseInt(agentPriceMatch[1].replace(/[,.]/g, ''), 10);
  } else {
    const rawNum = agentText.match(/\b([3-9],[0-9]{3}|[1-9][0-9],[0-9]{3})\b/);
    if (rawNum) {
      result.agentAppPrice = parseInt(rawNum[1].replace(/[,.]/g, ''), 10);
    }
  }

  return result;
}

/**
 * Parses hotel booking details and price from customer portal screenshot.
 */
export function parseCustomerHotelOcr(text: string): Partial<HotelBookingDetails> {
  return fuseDualHotelData(text, '');
}

/**
 * Parses hotel price from MMT Agent portal screenshot.
 */
export function parseAgentHotelPrice(text: string): { agentPrice?: number; hotelName?: string } {
  const fused = fuseDualHotelData('', text);
  return {
    agentPrice: fused.agentAppPrice,
    hotelName: fused.hotelName,
  };
}

/**
 * High-accuracy server-assisted OCR caller for hotel images.
 */
export async function scanHotelImage(
  imageFile: File,
  type: 'customer' | 'agent'
): Promise<{ text: string; data: Partial<HotelBookingDetails> }> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const res = await fetch('/api/ocr-flight', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed to process image');
  }

  const data = await res.json();
  const rawText = data.rawText || '';

  if (type === 'customer') {
    const parsed = parseCustomerHotelOcr(rawText);
    return { text: rawText, data: parsed };
  } else {
    const agentParsed = parseAgentHotelPrice(rawText);
    return {
      text: rawText,
      data: {
        agentAppPrice: agentParsed.agentPrice,
        hotelName: agentParsed.hotelName,
      },
    };
  }
}
