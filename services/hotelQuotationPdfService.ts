import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { HotelBookingDetails, HotelPricingQuote } from './hotelQuoteService';

/**
 * Generates an official, high-resolution Travel BZAR Branded Hotel Quotation PDF.
 */
export async function generateTravelBzarHotelQuotationPdf(
  hotel: HotelBookingDetails,
  quote: HotelPricingQuote,
  agencyName: string = 'Travel BZAR',
  agencyPhone: string = '+91 9007210697',
  agencyLocation: string = 'Dhanbad, Jharkhand'
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

  // WinAnsi text cleaner
  const clean = (str: string | undefined | null) =>
    (str || '')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2192\u2794]/g, '->')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Try embedding logo
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
    console.warn('Could not load logo for hotel quotation PDF:', err);
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
    page.drawText(agencyName.toUpperCase(), {
      x: left,
      y: cursorY - 14,
      size: 18,
      font: helveticaBold,
      color: primaryGreen,
    });
    page.drawText('PREMIUM HOTEL & RESORT CONCIERGE', {
      x: left,
      y: cursorY - 26,
      size: 7.5,
      font: helveticaBold,
      color: navyDark,
    });
  }

  // Right Header Meta
  const title = 'HOTEL STAY QUOTATION';
  const titleWidth = helveticaBold.widthOfTextAtSize(title, 12);
  page.drawText(title, {
    x: right - titleWidth,
    y: cursorY - 12,
    size: 12,
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

  // 2. HOTEL OVERVIEW HERO CARD
  const heroCardHeight = 68;
  page.drawRectangle({
    x: left,
    y: cursorY - heroCardHeight,
    width: contentWidth,
    height: heroCardHeight,
    color: cardBg,
    borderColor: slateLightBorder,
    borderWidth: 1,
  });

  page.drawRectangle({
    x: left,
    y: cursorY - heroCardHeight,
    width: 4,
    height: heroCardHeight,
    color: primaryGreen,
  });

  page.drawText(clean(hotel.hotelName), {
    x: left + 14,
    y: cursorY - 18,
    size: 13,
    font: helveticaBold,
    color: navyDark,
  });

  page.drawText(clean(`Location: ${hotel.location}${hotel.starRating ? ` · ${hotel.starRating}` : ''}`), {
    x: left + 14,
    y: cursorY - 34,
    size: 8.5,
    font: helvetica,
    color: slateMuted,
  });

  const badgeText = 'EXCLUSIVE NEGOTIATED CORPORATE RATE';
  page.drawText(badgeText, {
    x: left + 14,
    y: cursorY - 52,
    size: 7.5,
    font: helveticaBold,
    color: primaryGreen,
  });

  cursorY -= heroCardHeight + 16;

  // 3. STAY DURATION & GUEST SUMMARY STRIP
  const metaBoxHeight = 52;
  page.drawRectangle({
    x: left,
    y: cursorY - metaBoxHeight,
    width: contentWidth,
    height: metaBoxHeight,
    color: pureWhite,
    borderColor: slateLightBorder,
    borderWidth: 1,
  });

  const colWidth = contentWidth / 4;

  // Col 1: CHECK-IN
  page.drawText('CHECK-IN', { x: left + 14, y: cursorY - 16, size: 7.5, font: helveticaBold, color: slateMuted });
  page.drawText(clean(hotel.checkInDate), { x: left + 14, y: cursorY - 30, size: 9.5, font: helveticaBold, color: slateDark });
  page.drawText(clean(hotel.checkInTime), { x: left + 14, y: cursorY - 42, size: 7.5, font: helvetica, color: slateMuted });

  // Col 2: CHECK-OUT
  page.drawText('CHECK-OUT', { x: left + colWidth + 8, y: cursorY - 16, size: 7.5, font: helveticaBold, color: slateMuted });
  page.drawText(clean(hotel.checkOutDate), { x: left + colWidth + 8, y: cursorY - 30, size: 9.5, font: helveticaBold, color: slateDark });
  page.drawText(clean(hotel.checkOutTime), { x: left + colWidth + 8, y: cursorY - 42, size: 7.5, font: helvetica, color: slateMuted });

  // Col 3: DURATION
  page.drawText('STAY DURATION', { x: left + colWidth * 2 + 8, y: cursorY - 16, size: 7.5, font: helveticaBold, color: slateMuted });
  page.drawText(`${hotel.nights} Night${hotel.nights > 1 ? 's' : ''}`, { x: left + colWidth * 2 + 8, y: cursorY - 32, size: 11, font: helveticaBold, color: primaryGreen });

  // Col 4: GUESTS & ROOMS
  page.drawText('GUESTS & ROOMS', { x: left + colWidth * 3 + 8, y: cursorY - 16, size: 7.5, font: helveticaBold, color: slateMuted });
  page.drawText(clean(hotel.guestSummary), { x: left + colWidth * 3 + 8, y: cursorY - 32, size: 9.5, font: helveticaBold, color: slateDark });

  cursorY -= metaBoxHeight + 16;

  // 4. ROOM DETAILS & SPECIAL INCLUSIONS
  page.drawText('ROOM CATEGORY & PACKAGE INCLUSIONS', {
    x: left,
    y: cursorY,
    size: 9.5,
    font: helveticaBold,
    color: navyDark,
  });

  cursorY -= 10;

  const roomBoxHeight = 105;
  page.drawRectangle({
    x: left,
    y: cursorY - roomBoxHeight,
    width: contentWidth,
    height: roomBoxHeight,
    color: pureWhite,
    borderColor: slateLightBorder,
    borderWidth: 1,
  });

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

  page.drawText(clean(`Room Type: ${hotel.roomType}`), {
    x: left + 14,
    y: cursorY - 16,
    size: 9.5,
    font: helveticaBold,
    color: slateDark,
  });

  page.drawText(clean(`Meal Plan: ${hotel.mealPlan}`), {
    x: right - 180,
    y: cursorY - 16,
    size: 8.5,
    font: helveticaBold,
    color: primaryGreen,
  });

  let incY = cursorY - 42;
  const incList = hotel.inclusions.length > 0
    ? hotel.inclusions
    : ['Room with Complimentary Breakfast', '20% Special Privilege on Spa & Wellness', '20% Privilege on Food & Beverage Services'];

  incList.slice(0, 4).forEach((inc) => {
    page.drawCircle({ x: left + 18, y: incY + 2.5, size: 2.2, color: primaryGreen });
    page.drawText(clean(inc), {
      x: left + 28,
      y: incY,
      size: 8,
      font: helvetica,
      color: slateDark,
    });
    incY -= 15;
  });

  cursorY -= roomBoxHeight + 16;

  // 5. EXCLUSIVE PRICING & SAVINGS BREAKDOWN
  page.drawText('PRICING & EXCLUSIVE CLIENT SAVINGS', {
    x: left,
    y: cursorY,
    size: 9.5,
    font: helveticaBold,
    color: navyDark,
  });

  cursorY -= 10;

  const priceCardHeight = 90;
  page.drawRectangle({
    x: left,
    y: cursorY - priceCardHeight,
    width: contentWidth,
    height: priceCardHeight,
    color: cardBg,
    borderColor: slateLightBorder,
    borderWidth: 1,
  });

  // 3 Columns inside Pricing Card: Standard Public Rate, Client Privilege Discount, Final Quoted Price
  const pColWidth = contentWidth / 3;

  // Public Rate
  page.drawText('STANDARD PUBLIC RATE', { x: left + 16, y: cursorY - 20, size: 7.5, font: helveticaBold, color: slateMuted });
  page.drawText(`INR ${quote.customerAppPrice.toLocaleString('en-IN')}`, { x: left + 16, y: cursorY - 42, size: 14, font: helveticaBold, color: slateMuted });
  page.drawText('Online Hotel Portal Price', { x: left + 16, y: cursorY - 58, size: 7, font: helvetica, color: slateMuted });

  // Privilege Discount
  page.drawText('TRAVEL BZAR PRIVILEGE', { x: left + pColWidth + 16, y: cursorY - 20, size: 7.5, font: helveticaBold, color: slateMuted });
  const discText = quote.customerDiscountAmount > 0
    ? `- INR ${quote.customerDiscountAmount.toLocaleString('en-IN')} (${quote.customerDiscountPercent}% OFF)`
    : 'Best Guaranteed Rate';
  page.drawText(discText, { x: left + pColWidth + 16, y: cursorY - 42, size: 12, font: helveticaBold, color: primaryGreen });
  page.drawText('Direct Negotiated Savings', { x: left + pColWidth + 16, y: cursorY - 58, size: 7, font: helvetica, color: slateMuted });

  // Final Quoted Price
  page.drawText('EXCLUSIVE QUOTED PRICE', { x: left + pColWidth * 2 + 16, y: cursorY - 20, size: 8, font: helveticaBold, color: navyDark });
  page.drawText(`INR ${quote.quotedPrice.toLocaleString('en-IN')}`, { x: left + pColWidth * 2 + 16, y: cursorY - 44, size: 18, font: helveticaBold, color: primaryGreen });
  page.drawText('Inclusive of all taxes & resort fees', { x: left + pColWidth * 2 + 16, y: cursorY - 60, size: 7, font: helveticaOblique, color: slateMuted });

  cursorY -= priceCardHeight + 16;

  // 6. BOOKING ADVISORY NOTES
  page.drawText('RESERVATION NOTES & POLICIES', {
    x: left,
    y: cursorY,
    size: 9,
    font: helveticaBold,
    color: navyDark,
  });

  cursorY -= 14;

  const notes = [
    'Room reservation and special corporate rate are live and subject to hotel availability at final booking.',
    'Official hotel confirmation voucher with booking reference is issued immediately upon confirmation.',
    'Standard hotel check-in requires a valid government-issued photo ID for all adult occupants.',
    'Early check-in and late check-out are subject to hotel availability and policies.',
  ];

  notes.forEach((n) => {
    page.drawCircle({ x: left + 5, y: cursorY + 2.5, size: 2, color: primaryGreen });
    page.drawText(n, { x: left + 14, y: cursorY, size: 7.5, font: helvetica, color: slateMuted });
    cursorY -= 13;
  });

  // 7. BOTTOM BRAND CONCIERGE FOOTER
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

  page.drawText(`${agencyName.toUpperCase()} · HOTEL CONCIERGE & LUXURY TRAVEL`, {
    x: left + 14,
    y: 36 + 25,
    size: 8,
    font: helveticaBold,
    color: pureWhite,
  });
  page.drawText(`24x7 Helpline: ${agencyPhone} | ${agencyLocation}`, {
    x: left + 14,
    y: 36 + 12,
    size: 7,
    font: helvetica,
    color: rgb(0.75, 0.82, 0.9),
  });

  const cta = 'REPLY ON WHATSAPP TO CONFIRM';
  const ctaW = helveticaBold.widthOfTextAtSize(cta, 7.5);
  page.drawText(cta, {
    x: right - ctaW - 14,
    y: 36 + 18,
    size: 7.5,
    font: helveticaBold,
    color: primaryGreen,
  });

  return await pdfDoc.save();
}

