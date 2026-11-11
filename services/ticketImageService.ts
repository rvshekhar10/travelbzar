import { TicketSummaryInsight } from './ticketBrandingService';

/**
 * Renders a crisp 2D canvas representation of the Travel BZAR E-Ticket.
 * Used for instant 1-click clipboard image copy (for WhatsApp paste) without external canvas libraries.
 */
export async function renderTicketToCanvas(ticket: TicketSummaryInsight): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  // High-DPI canvas (800 x 1150)
  canvas.width = 800;
  canvas.height = 1150;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top Navy Banner
  ctx.fillStyle = '#061B33';
  ctx.fillRect(0, 0, canvas.width, 70);

  // Green accent stripe
  ctx.fillStyle = '#078A32';
  ctx.fillRect(0, 70, canvas.width, 4);

  // Logo / Title
  ctx.fillStyle = '#42B900';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('TRAVEL BZAR', 30, 42);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('E-TICKET & ITINERARY', 30, 58);

  // Booking Date on Top Right
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`BOOKING DATE : ${ticket.bookingDate.toUpperCase()}`, canvas.width - 30, 36);

  ctx.fillStyle = '#42B900';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(`● ${ticket.status.toUpperCase()}`, canvas.width - 30, 56);
  ctx.textAlign = 'left';

  // 1. Meta Grid Box
  const metaY = 94;
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(30, metaY, canvas.width - 60, 76, 12);
  ctx.fill();
  ctx.stroke();

  // Left Green indicator stripe
  ctx.fillStyle = '#078A32';
  ctx.beginPath();
  ctx.roundRect(30, metaY, 6, 76, [12, 0, 0, 12]);
  ctx.fill();

  const colWidth = (canvas.width - 60) / 4;

  // PNR
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('AIRLINE PNR', 50, metaY + 28);
  ctx.fillStyle = '#061B33';
  ctx.font = '900 18px monospace';
  ctx.fillText(ticket.pnr, 50, metaY + 54);

  // SECTOR
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('SECTOR', 50 + colWidth, metaY + 28);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.sector, 50 + colWidth, metaY + 54);

  // TRAVEL DATE
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('TRAVEL DATE', 50 + colWidth * 2, metaY + 28);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.travelDate, 50 + colWidth * 2, metaY + 54);

  // TRAVELLERS
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('TRAVELLERS', 50 + colWidth * 3, metaY + 28);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.travellerCountSummary, 50 + colWidth * 3, metaY + 54);

  // 2. Flight Details Card
  const flightY = 190;
  ctx.fillStyle = '#061B33';
  ctx.font = '900 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('FLIGHT DETAILS', 30, flightY);

  const cardBoxY = flightY + 10;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.roundRect(30, cardBoxY, canvas.width - 60, 140, 14);
  ctx.fill();
  ctx.stroke();

  // Top mini bar
  ctx.fillStyle = '#F1F5F9';
  ctx.beginPath();
  ctx.roundRect(30, cardBoxY, canvas.width - 60, 34, [14, 14, 0, 0]);
  ctx.fill();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${ticket.airline} ${ticket.flightNumber}`, 45, cardBoxY + 22);

  ctx.fillStyle = '#078A32';
  ctx.textAlign = 'right';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.fareTypeAndBaggage, canvas.width - 45, cardBoxY + 22);
  ctx.textAlign = 'left';

  // Origin
  ctx.fillStyle = '#078A32';
  ctx.font = '900 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.originCode, 45, cardBoxY + 65);

  ctx.fillStyle = '#0F172A';
  ctx.font = '900 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.departureTime, 95, cardBoxY + 65);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.departureDateFormatted, 45, cardBoxY + 86);

  ctx.fillStyle = '#64748B';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.originAirportName, 45, cardBoxY + 104);
  ctx.fillText(ticket.originCity, 45, cardBoxY + 120);

  // Center route
  const midX = canvas.width / 2;
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.duration, midX, cardBoxY + 68);

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(midX - 50, cardBoxY + 80);
  ctx.lineTo(midX + 50, cardBoxY + 80);
  ctx.stroke();

  ctx.fillStyle = '#078A32';
  ctx.beginPath();
  ctx.arc(midX, cardBoxY + 80, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.stops, midX, cardBoxY + 98);

  // Destination
  ctx.textAlign = 'left';
  const destX = canvas.width - 240;
  ctx.fillStyle = '#078A32';
  ctx.font = '900 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.destCode, destX, cardBoxY + 65);

  ctx.fillStyle = '#0F172A';
  ctx.font = '900 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.arrivalTime, destX + 50, cardBoxY + 65);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.arrivalDateFormatted, destX, cardBoxY + 86);

  ctx.fillStyle = '#64748B';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.destAirportName, destX, cardBoxY + 104);
  ctx.fillText(ticket.destTerminalCity, destX, cardBoxY + 120);

  // 3. Travellers Details Table
  const tableTitleY = cardBoxY + 165;
  ctx.fillStyle = '#061B33';
  ctx.font = '900 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('TRAVELLER DETAILS', 30, tableTitleY);

  const tableY = tableTitleY + 10;
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.roundRect(30, tableY, canvas.width - 60, 32, [8, 8, 0, 0]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('TRAVELLER NAME', 45, tableY + 20);
  ctx.fillText('TYPE', 260, tableY + 20);
  ctx.fillText('PNR', 380, tableY + 20);
  ctx.fillText('TICKET NO.', 490, tableY + 20);
  ctx.fillText('SEAT', 610, tableY + 20);
  ctx.fillText('FF NO.', 700, tableY + 20);

  let curRowY = tableY + 32;
  ticket.passengers.forEach((pax, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    ctx.fillRect(30, curRowY, canvas.width - 60, 30);
    ctx.strokeStyle = '#E2E8F0';
    ctx.strokeRect(30, curRowY, canvas.width - 60, 30);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(pax.name, 45, curRowY + 20);

    ctx.fillStyle = '#64748B';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText(pax.type, 260, curRowY + 20);

    ctx.fillStyle = '#0F172A';
    ctx.fillText(pax.pnr, 380, curRowY + 20);
    ctx.fillText(pax.ticketNo, 490, curRowY + 20);

    ctx.fillStyle = '#078A32';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(pax.seat, 610, curRowY + 20);

    ctx.fillStyle = '#64748B';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText(pax.ffNo, 700, curRowY + 20);

    curRowY += 30;
  });

  // 4. Important Information & Fare Summary
  const bottomSectionY = curRowY + 25;

  // Left: Important Information
  ctx.fillStyle = '#061B33';
  ctx.font = '900 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('IMPORTANT INFORMATION', 30, bottomSectionY);

  let noteY = bottomSectionY + 22;
  ticket.importantInfoNotes.forEach((note) => {
    ctx.fillStyle = '#078A32';
    ctx.beginPath();
    ctx.arc(38, noteY - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = '10.5px system-ui, -apple-system, sans-serif';

    // Simple text wrapping for 410px width
    const words = note.split(' ');
    let line = '';
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > 400) {
        ctx.fillText(line, 48, noteY);
        noteY += 16;
        line = w;
      } else {
        line = test;
      }
    });
    if (line) {
      ctx.fillText(line, 48, noteY);
      noteY += 20;
    }
  });

  // Right: Fare Summary Box
  const fareX = canvas.width - 280;
  ctx.fillStyle = '#061B33';
  ctx.font = '900 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('FARE SUMMARY', fareX, bottomSectionY);

  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.roundRect(fareX, bottomSectionY + 10, 250, 140, 12);
  ctx.fill();
  ctx.stroke();

  let fY = bottomSectionY + 36;
  ctx.fillStyle = '#64748B';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Airline Fare & Taxes', fareX + 15, fY);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.airlineFareAndTaxes, fareX + 235, fY);
  ctx.textAlign = 'left';

  fY += 26;
  ctx.fillStyle = '#64748B';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Platform / Service Fees', fareX + 15, fY);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.platformServiceFees, fareX + 235, fY);
  ctx.textAlign = 'left';

  fY += 16;
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.moveTo(fareX + 15, fY);
  ctx.lineTo(fareX + 235, fY);
  ctx.stroke();

  fY += 26;
  ctx.fillStyle = '#061B33';
  ctx.font = '900 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('TOTAL FARE', fareX + 15, fY);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#078A32';
  ctx.font = '900 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(ticket.totalFare, fareX + 235, fY);
  ctx.textAlign = 'left';

  fY += 22;
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'italic 9.5px system-ui, -apple-system, sans-serif';
  ctx.fillText('Inclusive of all taxes & fees (INR)', fareX + 15, fY);

  // Bottom Concierge Bar
  ctx.fillStyle = '#061B33';
  ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

  ctx.fillStyle = '#078A32';
  ctx.fillRect(0, canvas.height - 60, canvas.width, 3);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('TRAVEL BZAR CONCIERGE & AIRPORT MOBILITY', 30, canvas.height - 34);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('24x7 Helpline: +91 9007210697 | Dhanbad, Jharkhand', 30, canvas.height - 18);

  ctx.fillStyle = '#42B900';
  ctx.textAlign = 'right';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('OFFICIALLY VERIFIED TICKET ✓', canvas.width - 30, canvas.height - 26);
  ctx.textAlign = 'left';

  return canvas;
}

