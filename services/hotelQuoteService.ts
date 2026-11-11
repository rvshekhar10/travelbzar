export interface HotelBookingDetails {
  hotelName: string; // e.g. "Welcomhotel by ITC Hotels, Dwarka, New Delhi"
  starRating?: string; // e.g. "5 Star Hotel"
  location: string; // e.g. "Sector 10 Dwarka, Delhi"

  // Stay Duration & Dates
  checkInDate: string; // e.g. "11 Nov 2026, Wed"
  checkInTime: string; // e.g. "3:00 PM"
  checkOutDate: string; // e.g. "12 Nov 2026, Thu"
  checkOutTime: string; // e.g. "12:00 PM"
  nights: number; // e.g. 1

  // Personnel / Guests & Room
  guestSummary: string; // e.g. "2 Adults • 1 Room"
  adultsCount: number; // 2
  roomsCount: number; // 1
  roomType: string; // e.g. "Deluxe Room Double"
  mealPlan: string; // e.g. "Room with Breakfast"
  inclusions: string[]; // ["Room with Breakfast", "20% off on Spa", "20% off on Food & Beverages"]

  // Pricing & Sharing Markup
  customerAppPrice: number; // e.g. 6321
  agentAppPrice: number; // e.g. 6003
  customerName?: string;
  notes?: string;
}

export interface HotelPricingQuote {
  customerAppPrice: number;
  agentAppPrice: number;
  diffAmount: number;
  totalDiffPercent: number; // relative to customerAppPrice

  // Sharing Rules:
  // - If diff > 40%: customer gets max 20% off, owner keeps rest (60% etc.)
  // - If diff <= 40%: 50-50 share of the difference (e.g. 15% diff => 7.5% customer off, 7.5% owner profit)
  customerDiscountPercent: number;
  customerDiscountAmount: number;
  quotedPrice: number; // Final price charged to customer
  ownerProfitAmount: number;
  ownerProfitPercent: number;
}

/**
 * Calculates the exact customer discount and owner margin based on the user's sharing rules:
 * - Customer gets up to max 20% discount on customer portal price.
 * - If the difference is smaller (diff% <= 40%), owner and customer share 50-50 (e.g. 15% diff => 7.5% off each).
 */
export function calculateHotelQuote(customerAppPrice: number, agentAppPrice: number): HotelPricingQuote {
  const custPrice = Math.round(Number(customerAppPrice) || 0);
  const agentPrice = Math.round(Number(agentAppPrice) || 0);

  const diff = custPrice - agentPrice;
  if (diff <= 0 || custPrice <= 0) {
    return {
      customerAppPrice: custPrice,
      agentAppPrice: agentPrice,
      diffAmount: 0,
      totalDiffPercent: 0,
      customerDiscountPercent: 0,
      customerDiscountAmount: 0,
      quotedPrice: custPrice,
      ownerProfitAmount: 0,
      ownerProfitPercent: 0,
    };
  }

  const totalDiffPercent = (diff / custPrice) * 100;

  let customerDiscountPercent = 0;
  let ownerProfitPercent = 0;

  if (totalDiffPercent > 40) {
    // Large gap: cap customer discount at 20%, owner keeps the rest
    customerDiscountPercent = 20;
    ownerProfitPercent = totalDiffPercent - 20;
  } else {
    // 50-50 sharing of the difference
    customerDiscountPercent = totalDiffPercent / 2;
    ownerProfitPercent = totalDiffPercent / 2;
  }

  const customerDiscountAmount = Math.round(custPrice * (customerDiscountPercent / 100));
  const quotedPrice = custPrice - customerDiscountAmount;
  const ownerProfitAmount = quotedPrice - agentPrice;

  return {
    customerAppPrice: custPrice,
    agentAppPrice: agentPrice,
    diffAmount: diff,
    totalDiffPercent: parseFloat(totalDiffPercent.toFixed(2)),
    customerDiscountPercent: parseFloat(customerDiscountPercent.toFixed(2)),
    customerDiscountAmount,
    quotedPrice,
    ownerProfitAmount,
    ownerProfitPercent: parseFloat(ownerProfitPercent.toFixed(2)),
  };
}

/**
 * Formats a WhatsApp quotation message for the hotel booking.
 */
export function generateHotelWhatsAppQuoteText(
  hotel: HotelBookingDetails,
  quote: HotelPricingQuote,
  agencyName: string = 'Travel BZAR',
  agencyPhone: string = '+91 9007210697',
  agencyLocation: string = 'Dhanbad, Jharkhand'
): string {
  let text = `🏨 *EXCLUSIVE HOTEL QUOTATION — ${agencyName.toUpperCase()}*\n`;
  if (hotel.customerName) {
    text += `Dear *${hotel.customerName}*,\n`;
  }
  text += `We have secured an exclusive corporate discounted rate for your hotel stay:\n\n`;

  text += `🏨 *Hotel:* *${hotel.hotelName || 'Selected Luxury Hotel'}*\n`;
  if (hotel.starRating) {
    text += `⭐ *Category:* ${hotel.starRating}\n`;
  }
  if (hotel.location) {
    text += `📍 *Location:* ${hotel.location}\n`;
  }
  text += `───────────────────────\n`;

  if (hotel.checkInDate || hotel.checkOutDate) {
    text += `📅 *Check-In:* ${hotel.checkInDate || 'TBD'} (${hotel.checkInTime || '3:00 PM'})\n`;
    text += `📅 *Check-Out:* ${hotel.checkOutDate || 'TBD'} (${hotel.checkOutTime || '12:00 PM'})\n`;
    text += `🌙 *Stay Duration:* ${hotel.nights} Night${hotel.nights > 1 ? 's' : ''}\n`;
  }
  if (hotel.guestSummary) {
    text += `👥 *Guests & Room:* ${hotel.guestSummary}\n`;
  }
  if (hotel.roomType) {
    text += `🛏️ *Room Category:* *${hotel.roomType}*\n`;
  }
  if (hotel.mealPlan) {
    text += `🍱 *Meal Plan:* ${hotel.mealPlan}\n`;
  }

  if (hotel.inclusions && hotel.inclusions.length > 0) {
    text += `\n✨ *Special Inclusions:*\n`;
    hotel.inclusions.forEach((inc) => {
      text += `  • ${inc}\n`;
    });
  }

  text += `───────────────────────\n`;
  if (quote.customerAppPrice > 0) {
    text += `🏷️ *Standard Public Portal Rate:* ~₹${quote.customerAppPrice.toLocaleString('en-IN')}~\n`;
  }
  if (quote.customerDiscountAmount > 0) {
    text += `🎁 *Travel BZAR Discount:* *₹${quote.customerDiscountAmount.toLocaleString('en-IN')} OFF* (${quote.customerDiscountPercent}% Special Privilege)\n`;
  }
  text += `💰 *Exclusive Quoted Price:* *₹${quote.quotedPrice.toLocaleString('en-IN')}*\n`;
  text += `_(Inclusive of all luxury taxes, resort fees & service charges)_\n`;
  text += `───────────────────────\n\n`;

  text += `📌 *Booking Policy:*\n`;
  text += `• Room inventory & special rates are live and subject to availability.\n`;
  text += `• Instant booking voucher issued upon confirmation.\n\n`;

  text += `📞 *To confirm your reservation, reply here or contact:*\n`;
  text += `*${agencyName} Concierge:* ${agencyPhone}\n`;
  text += `📍 ${agencyLocation}`;

  return text;
}

