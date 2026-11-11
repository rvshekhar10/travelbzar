import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { TripHeaderDetails, ExtractedFlightOption, MarkupSettings, calculateQuotedFare, getCancellationFee } from './flightQuoteService';

/**
 * Generates an official, high-resolution Travel BZAR Flight Quotation PDF document.
 * Includes complete sector, dates, live airline flight options, offer prices, inclusions,
 * and cancellation terms in Travel BZAR branding.
 */
export async function generateTravelBzarQuotationPdf(
  trip: TripHeaderDetails,
  flights: ExtractedFlightOption[],
  settings: MarkupSettings
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // Standard A4 Size: 595.28 x 841.89 points
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette
  const navyDark = rgb(0.024, 0.106, 0.2); // #061B33
  const primaryGreen = rgb(0.027, 0.541, 0.196); // #078A32
  const slateDark = rgb(0.09, 0.13, 0.18);
  const slateMuted = rgb(0.4, 0.45, 0.52);
  const slateLightBorder = rgb(0.88, 0.9, 0.93);
  const cardBg = rgb(0.97, 0.98, 0.99);
  const pureWhite = rgb(1, 1, 1);

  // Text cleaner
  const clean = (str: string | undefined | null) =>
    (str || '')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2192\u2794]/g, '->')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Logo Embedding
  let logoImage: any = null;
  try {
    if (typeof window !== 'undefined') {
      const resp = await fetch('/logo-wide.png');
      if (resp.ok) {
        const logoBuffer = await resp.arrayBuffer();
        logoImage = await pdfDoc.embedPng(logoBuffer);
      }
    }
  } catch (err) {
    console.warn('Could not load logo for quotation PDF:', err);
  }

  const left = 36;
  const right = width - 36;
  const contentWidth = right - left;
  let cursorY = height - 36;

  // 1. TOP BRAND HEADER
  if (logoImage) {
    const logoDims = logoImage.scale(0.24);
    page.drawImage(logoImage, {
      x: left,
      y: cursorY - logoDims.height + 4,
      width: logoDims.width,
      height: logoDims.height,
    });
  } else {
    page.drawText('TRAVEL BZAR', {
      x: left,
      y: cursorY - 14,
      size: 18,
      font: helveticaBold,
      color: primaryGreen,
    });
    page.drawText('PREMIUM AIRLINE & MOBILITY CONCIERGE', {
      x: left,
      y: cursorY - 26,
      size: 7.5,
      font: helveticaBold,
      color: navyDark,
    });
  }

  // Right Header Meta
  const title = 'FLIGHT QUOTATION';
  const titleWidth = helveticaBold.widthOfTextAtSize(title, 13);
  page.drawText(title, {
    x: right - titleWidth,
    y: cursorY - 12,
    size: 13,
    font: helveticaBold,
    color: navyDark,
  });

  const refDateText = `DATE: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}`;
  const refWidth = helvetica.widthOfTextAtSize(refDateText, 8);
  page.drawText(refDateText, {
    x: right - refWidth,
    y: cursorY - 25,
    size: 8,
    font: helvetica,
    color: slateMuted,
  });

  cursorY -= 48;

  page.drawLine({
    start: { x: left, y: cursorY },
    end: { x: right, y: cursorY },
    thickness: 1,
    color: slateLightBorder,
  });

  cursorY -= 14;

  // 2. TRIP DETAILS SUMMARY STRIP
  const tripBoxHeight = 54;
  page.drawRectangle({
    x: left,
    y: cursorY - tripBoxHeight,
    width: contentWidth,
    height: tripBoxHeight,
    color: cardBg,
    borderColor: slateLightBorder,
    borderWidth: 1,
  });

  page.drawRectangle({
    x: left,
    y: cursorY - tripBoxHeight,
    width: 4,
    height: tripBoxHeight,
    color: primaryGreen,
  });

  const colWidth = contentWidth / 5;

  // Col 1: Trip Type & Customer
  page.drawText(trip.customerName ? clean(`For: ${trip.customerName}`) : 'Flight Enquiry', {
    x: left + 14,
    y: cursorY - 16,
    size: 9,
    font: helveticaBold,
    color: slateDark,
  });
  page.drawText(clean(`${trip.tripType === 'return' ? 'ROUND TRIP' : 'ONE WAY'} · ${trip.cabinClass}`), {
    x: left + 14,
    y: cursorY - 29,
    size: 7.5,
    font: helvetica,
    color: slateMuted,
  });
  page.drawText('VERIFIED LIVE RATES', {
    x: left + 14,
    y: cursorY - 42,
    size: 7.5,
    font: helveticaBold,
    color: primaryGreen,
  });

  // Col 2: FROM
  page.drawText('FROM', { x: left + colWidth + 8, y: cursorY - 16, size: 7.5, font: helveticaBold, color: slateMuted });
  page.drawText(clean(trip.fromCity), { x: left + colWidth + 8, y: cursorY - 32, size: 11, font: helveticaBold, color: navyDark });

  // Col 3: TO
  page.drawText('TO', { x: left + colWidth * 2 + 8, y: cursorY - 16, size: 7.5, font: helveticaBold, color: slateMuted });
  page.drawText(clean(trip.toCity), { x: left + colWidth * 2 + 8, y: cursorY - 32, size: 11, font: helveticaBold, color: navyDark });

  // Col 4: DATES
  page.drawText('TRAVEL DATE(S)', { x: left + colWidth * 3 + 8, y: cursorY - 16, size: 7.5, font: helveticaBold, color: slateMuted });
  const dateStr = trip.tripType === 'return' && trip.returnDate
    ? `${clean(trip.departDate)} - ${clean(trip.returnDate)}`
    : clean(trip.departDate);
  page.drawText(dateStr, { x: left + colWidth * 3 + 8, y: cursorY - 32, size: 9.5, font: helveticaBold, color: slateDark });

  // Col 5: PASSENGERS
  page.drawText('PASSENGERS', { x: left + colWidth * 4 + 8, y: cursorY - 16, size: 7.5, font: helveticaBold, color: slateMuted });
  page.drawText(`${trip.passengerCount} Pax`, { x: left + colWidth * 4 + 8, y: cursorY - 32, size: 11, font: helveticaBold, color: slateDark });

  cursorY -= tripBoxHeight + 18;

  // 3. AVAILABLE FLIGHT OPTIONS
  page.drawText('RECOMMENDED FLIGHT OPTIONS', {
    x: left,
    y: cursorY,
    size: 10,
    font: helveticaBold,
    color: navyDark,
  });

  cursorY -= 12;

  flights.forEach((opt, idx) => {
    const { finalFare } = calculateQuotedFare(opt.baseFare, opt.fareCategory, settings);
    const offerPrice = opt.offerPrice && opt.offerPrice > 0 ? opt.offerPrice : finalFare;
    const totalPaxPrice = offerPrice * trip.passengerCount;
    const cancel = getCancellationFee(opt.airline, opt.fareCategory, settings);

    const cardHeight = 88;
    page.drawRectangle({
      x: left,
      y: cursorY - cardHeight,
      width: contentWidth,
      height: cardHeight,
      color: pureWhite,
      borderColor: slateLightBorder,
      borderWidth: 1,
    });

    // Option Header Strip inside card
    page.drawRectangle({
      x: left,
      y: cursorY - 24,
      width: contentWidth,
      height: 24,
      color: cardBg,
    });
    page.drawLine({
      start: { x: left, y: cursorY - 24 },
      end: { x: right, y: cursorY - 24 },
      thickness: 1,
      color: slateLightBorder,
    });

    // Airline & Flight No
    page.drawText(clean(`Option ${idx + 1}: ${opt.airline} (${opt.flightNumber || 'Direct'})`), {
      x: left + 12,
      y: cursorY - 16,
      size: 9.5,
      font: helveticaBold,
      color: slateDark,
    });

    // Fare Category Badge
    const catName =
      opt.fareCategory === 'sme'
        ? 'SME Corporate Fare'
        : opt.fareCategory === 'special_non_refundable'
        ? 'Special Non-Refundable'
        : opt.fareCategory === 'flex'
        ? 'Flexi Plus'
        : opt.fareCategory === 'classic'
        ? 'Classic'
        : 'Value Saver';

    const catBadgeWidth = helveticaBold.widthOfTextAtSize(catName, 8);
    page.drawText(catName, {
      x: right - catBadgeWidth - 12,
      y: cursorY - 16,
      size: 8,
      font: helveticaBold,
      color: primaryGreen,
    });

    // Departure & Arrival times
    const timeY = cursorY - 45;
    page.drawText(clean(opt.departureTime || '--:--'), {
      x: left + 14,
      y: timeY,
      size: 15,
      font: helveticaBold,
      color: slateDark,
    });
    page.drawText(clean(trip.fromCity), {
      x: left + 14,
      y: timeY - 14,
      size: 8,
      font: helvetica,
      color: slateMuted,
    });

    // Flight route duration
    const midX = left + 175;
    page.drawText(clean(opt.duration || '2h 10m'), {
      x: midX - 20,
      y: timeY + 6,
      size: 7.5,
      font: helvetica,
      color: slateMuted,
    });
    page.drawLine({
      start: { x: midX - 35, y: timeY - 2 },
      end: { x: midX + 35, y: timeY - 2 },
      thickness: 1,
      color: slateLightBorder,
    });
    page.drawCircle({ x: midX, y: timeY - 2, size: 2.5, color: primaryGreen });
    page.drawText(clean(opt.stops || 'Non-stop'), {
      x: midX - 18,
      y: timeY - 12,
      size: 7.5,
      font: helveticaBold,
      color: slateMuted,
    });

    // Arrival time
    page.drawText(clean(opt.arrivalTime || '--:--'), {
      x: left + 245,
      y: timeY,
      size: 15,
      font: helveticaBold,
      color: slateDark,
    });
    page.drawText(clean(trip.toCity), {
      x: left + 245,
      y: timeY - 14,
      size: 8,
      font: helvetica,
      color: slateMuted,
    });

    // Pricing box on the right of card
    const priceBoxX = right - 160;
    page.drawText('OFFER PRICE', {
      x: priceBoxX,
      y: timeY + 5,
      size: 7.5,
      font: helveticaBold,
      color: slateMuted,
    });

    const priceText = `INR ${offerPrice.toLocaleString('en-IN')}`;
    page.drawText(priceText, {
      x: priceBoxX,
      y: timeY - 10,
      size: 14,
      font: helveticaBold,
      color: primaryGreen,
    });

    const paxTotalText = trip.passengerCount > 1
      ? `Total (${trip.passengerCount} Pax): INR ${totalPaxPrice.toLocaleString('en-IN')}`
      : 'Per Adult / All Inclusive';
    page.drawText(clean(paxTotalText), {
      x: priceBoxX,
      y: timeY - 22,
      size: 7,
      font: helvetica,
      color: slateMuted,
    });

    // Inclusions & Cancellation footer strip inside the card
    const inclY = cursorY - 76;
    const inclText = `Inclusions: Cabin ${opt.cabinBaggage || '7 Kg'} · Check-in ${opt.checkInBaggage || '15 Kg'}${opt.mealIncluded ? ' · Meal Included' : ''}${opt.seatIncluded ? ' · Free Seat' : ''}  |  Cancellation: ${clean(cancel.note)}`;
    page.drawText(inclText, {
      x: left + 14,
      y: inclY,
      size: 7,
      font: helvetica,
      color: slateMuted,
    });

    cursorY -= cardHeight + 10;
  });

  cursorY -= 8;

  // 4. IMPORTANT TERMS & BOOKING INSTRUCTIONS
  page.drawText('IMPORTANT BOOKING NOTES', {
    x: left,
    y: cursorY,
    size: 9.5,
    font: helveticaBold,
    color: navyDark,
  });

  cursorY -= 14;

  const notes = [
    'Airfares and seat inventory are live and subject to airline availability at the time of final ticketing.',
    'Instant booking confirmation & verified e-ticket delivered directly to your WhatsApp.',
    'Cancellation, reschedule and date change penalties are governed by individual airline fare rules.',
    'Government photo ID is mandatory for airport entry and check-in for all passengers.',
  ];

  notes.forEach((note) => {
    page.drawCircle({ x: left + 5, y: cursorY + 2.5, size: 2, color: primaryGreen });
    page.drawText(note, {
      x: left + 14,
      y: cursorY,
      size: 7.5,
      font: helvetica,
      color: slateMuted,
    });
    cursorY -= 13;
  });

  // 5. BOTTOM BRAND CONCIERGE BANNER
  const bottomBannerHeight = 44;
  page.drawRectangle({
    x: left,
    y: 36,
    width: contentWidth,
    height: bottomBannerHeight,
    color: navyDark,
  });

  page.drawRectangle({
    x: left,
    y: 36 + bottomBannerHeight - 2,
    width: contentWidth,
    height: 2,
    color: primaryGreen,
  });

  page.drawText(`${settings.agencyName.toUpperCase()} · FLIGHT & AIRPORT CONCIERGE`, {
    x: left + 14,
    y: 36 + 25,
    size: 8,
    font: helveticaBold,
    color: pureWhite,
  });
  page.drawText(`24x7 Helpline: ${settings.agencyPhone} | ${settings.agencyLocation}`, {
    x: left + 14,
    y: 36 + 12,
    size: 7,
    font: helvetica,
    color: rgb(0.75, 0.82, 0.9),
  });

  const callToAction = 'REPLY ON WHATSAPP TO CONFIRM';
  const ctaWidth = helveticaBold.widthOfTextAtSize(callToAction, 7.5);
  page.drawText(callToAction, {
    x: right - ctaWidth - 14,
    y: 36 + 18,
    size: 7.5,
    font: helveticaBold,
    color: primaryGreen,
  });

  return await pdfDoc.save();
}

