'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Download,
  Share2,
  Copy,
  Check,
  Printer,
  Sparkles,
  Plane,
  ShieldCheck,
  RefreshCw,
  Eye,
  Plus,
  Trash2,
  Sliders,
} from 'lucide-react';
import {
  TicketSummaryInsight,
  PassengerDetail,
  parsePdfTicketInsights,
  generateTravelBzarBrandedPdf,
  generateTicketWhatsAppSummary,
} from '@/services/ticketBrandingService';
import { renderTicketToCanvas } from '@/services/ticketImageService';

export default function TicketBrandingToolPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPdfBuffer, setOriginalPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Insights State
  const [ticket, setTicket] = useState<TicketSummaryInsight | null>(null);
  const [brandedPdfUrl, setBrandedPdfUrl] = useState<string | null>(null);
  const [brandedPdfBlob, setBrandedPdfBlob] = useState<Blob | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showShareGuide, setShowShareGuide] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF ticket file.');
      return;
    }

    setOriginalFile(file);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      setOriginalPdfBuffer(buffer);

      // 1. Extract accurate insights from PDF
      const parsed = await parsePdfTicketInsights(buffer);
      setTicket(parsed);

      // 2. Generate a fresh, pristine Travel BZAR branded e-ticket PDF
      const brandedBytes = await generateTravelBzarBrandedPdf(buffer, parsed);
      const blob = new Blob([brandedBytes as BlobPart], { type: 'application/pdf' });
      setBrandedPdfBlob(blob);
      const url = URL.createObjectURL(blob);
      setBrandedPdfUrl(url);
    } catch (err) {
      console.error('PDF Branding Error:', err);
      alert('Could not parse the PDF ticket. Please make sure the PDF is not password protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateTicketField = (field: keyof TicketSummaryInsight, value: any) => {
    if (!ticket) return;
    setTicket({ ...ticket, [field]: value });
  };

  const handleUpdatePassenger = (index: number, field: keyof PassengerDetail, value: string) => {
    if (!ticket) return;
    const updated = [...ticket.passengers];
    updated[index] = { ...updated[index], [field]: value };
    setTicket({ ...ticket, passengers: updated });
  };

  const handleAddPassenger = () => {
    if (!ticket) return;
    const newPax: PassengerDetail = {
      name: 'Passenger Name',
      type: 'Adult (M)',
      pnr: ticket.pnr,
      ticketNo: ticket.pnr,
      seat: '–',
      ffNo: '–',
    };
    setTicket({ ...ticket, passengers: [...ticket.passengers, newPax] });
  };

  const handleRemovePassenger = (index: number) => {
    if (!ticket || ticket.passengers.length <= 1) return;
    setTicket({
      ...ticket,
      passengers: ticket.passengers.filter((_, i) => i !== index),
    });
  };

  const handleReapplyBranding = async () => {
    if (!ticket) return;
    setIsProcessing(true);
    try {
      const emptyBuffer = originalPdfBuffer || new ArrayBuffer(0);
      const brandedBytes = await generateTravelBzarBrandedPdf(emptyBuffer, ticket);
      const blob = new Blob([brandedBytes as BlobPart], { type: 'application/pdf' });
      setBrandedPdfBlob(blob);
      const url = URL.createObjectURL(blob);
      setBrandedPdfUrl(url);
    } finally {
      setIsProcessing(false);
    }
  };

  const whatsAppSummaryText = ticket ? generateTicketWhatsAppSummary(ticket) : '';

  const [sharing, setSharing] = useState(false);

  // Single Master Share Action optimized for Mobile Phone & WhatsApp
  const handleShareAll = async () => {
    if (!ticket) return;
    setSharing(true);

    const fileName = `TravelBzar_ETicket_${ticket.pnr}.pdf`;

    try {
      // 1. Mobile Phone Native Share (iOS Safari, Android Chrome):
      // Directly opens WhatsApp with the attached PDF file AND the formatted text caption in one go
      if (brandedPdfBlob && typeof navigator !== 'undefined' && navigator.canShare) {
        const file = new File([brandedPdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Travel BZAR E-Ticket - ${ticket.pnr}`,
            text: whatsAppSummaryText,
          });
          setSharing(false);
          return;
        }
      }

      // 2. Fallback for Desktop/unsupported browsers:
      // Download PDF and open WhatsApp Web with text
      if (brandedPdfUrl) {
        const link = document.createElement('a');
        link.href = brandedPdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      const url = `https://wa.me/?text=${encodeURIComponent(whatsAppSummaryText)}`;
      window.open(url, '_blank');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Share error, opening WhatsApp URL fallback:', err);
        const url = `https://wa.me/?text=${encodeURIComponent(whatsAppSummaryText)}`;
        window.open(url, '_blank');
      }
    } finally {
      setSharing(false);
    }
  };

  // Emergency Copy Text Button
  const handleCopyTextOnly = async () => {
    if (!ticket) return;
    await navigator.clipboard.writeText(whatsAppSummaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#078A32] text-xs font-black uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Owner Commercial Tool #2</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">
            PDF to Travel BZAR Branded Ticket
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Converts any partner flight PDF into a pristine, high-resolution Travel BZAR branded e-ticket with your official logo, sector, itinerary & passenger breakdown.
          </p>
        </div>

        <Link
          href="/owner/tools/flight-quote"
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all"
        >
          <Plane className="w-4 h-4 text-[#078A32]" />
          <span>Switch to Flight Quote OCR</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: PDF Upload & Editable Ticket Details */}
        <div className="lg:col-span-7 space-y-5">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-400 hover:border-[#078A32] bg-emerald-50/50 hover:bg-emerald-50 p-6 sm:p-8 rounded-3xl text-center cursor-pointer transition-all space-y-3 relative overflow-hidden"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="w-12 h-12 rounded-2xl bg-white text-[#078A32] flex items-center justify-center mx-auto shadow-sm">
              <FileText className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900">
                {originalFile ? originalFile.name : 'Upload Partner Ticket PDF'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {originalFile
                  ? `${Math.round(originalFile.size / 1024)} KB • Click to choose a different PDF`
                  : 'Click or drop PDF ticket downloaded from airline / partner agent portal'}
              </p>
            </div>

            {isProcessing && (
              <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-4 space-y-2">
                <RefreshCw className="w-6 h-6 text-[#078A32] animate-spin" />
                <span className="text-xs font-black text-slate-800">
                  Generating Travel BZAR Branded Ticket...
                </span>
              </div>
            )}
          </div>

          {/* Extracted Ticket Details Form */}
          {ticket && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wider block">
                    Verified Ticket Data (Exact PDF Mirror)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Review and adjust details before downloading or sharing.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReapplyBranding}
                  className="text-xs font-bold text-white bg-[#078A32] hover:bg-[#056B27] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate PDF</span>
                </button>
              </div>

              {/* 1. Header & Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                    Booking Date
                  </label>
                  <input
                    type="text"
                    value={ticket.bookingDate}
                    onChange={(e) => handleUpdateTicketField('bookingDate', e.target.value)}
                    className="w-full font-bold px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                    Airline PNR
                  </label>
                  <input
                    type="text"
                    value={ticket.pnr}
                    onChange={(e) => handleUpdateTicketField('pnr', e.target.value.toUpperCase())}
                    className="w-full font-mono font-black px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                    Sector
                  </label>
                  <input
                    type="text"
                    value={ticket.sector}
                    onChange={(e) => handleUpdateTicketField('sector', e.target.value.toUpperCase())}
                    className="w-full font-bold px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                    Travel Date
                  </label>
                  <input
                    type="text"
                    value={ticket.travelDate}
                    onChange={(e) => handleUpdateTicketField('travelDate', e.target.value)}
                    className="w-full font-bold px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* 2. Flight & Timing */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-800 uppercase block">Flight & Schedule</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Airline</label>
                    <input
                      type="text"
                      value={ticket.airline}
                      onChange={(e) => handleUpdateTicketField('airline', e.target.value)}
                      className="w-full font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Flight Number</label>
                    <input
                      type="text"
                      value={ticket.flightNumber}
                      onChange={(e) => handleUpdateTicketField('flightNumber', e.target.value)}
                      className="w-full font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Travellers Count</label>
                    <input
                      type="text"
                      value={ticket.travellerCountSummary}
                      onChange={(e) => handleUpdateTicketField('travellerCountSummary', e.target.value)}
                      className="w-full font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                {/* Origin vs Destination */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-emerald-700 block uppercase">Departure ({ticket.originCode})</span>
                    <input
                      type="text"
                      value={ticket.departureTime}
                      onChange={(e) => handleUpdateTicketField('departureTime', e.target.value)}
                      placeholder="14:50"
                      className="w-full font-black text-sm my-1 px-2 py-1 rounded border border-slate-200"
                    />
                    <input
                      type="text"
                      value={ticket.originAirportName}
                      onChange={(e) => handleUpdateTicketField('originAirportName', e.target.value)}
                      placeholder="Birsa Munda Airport"
                      className="w-full text-[11px] text-slate-600 px-2 py-0.5 rounded border border-slate-200"
                    />
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-emerald-700 block uppercase">Arrival ({ticket.destCode})</span>
                    <input
                      type="text"
                      value={ticket.arrivalTime}
                      onChange={(e) => handleUpdateTicketField('arrivalTime', e.target.value)}
                      placeholder="16:45"
                      className="w-full font-black text-sm my-1 px-2 py-1 rounded border border-slate-200"
                    />
                    <input
                      type="text"
                      value={ticket.destAirportName}
                      onChange={(e) => handleUpdateTicketField('destAirportName', e.target.value)}
                      placeholder="Indira Gandhi International Airport"
                      className="w-full text-[11px] text-slate-600 px-2 py-0.5 rounded border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Passengers Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 uppercase block">
                    Traveller Details ({ticket.passengers.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPassenger}
                    className="text-[11px] font-bold text-[#078A32] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Passenger</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {ticket.passengers.map((pax, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-5">
                        <label className="text-[9px] text-slate-400 font-bold block uppercase">Name</label>
                        <input
                          type="text"
                          value={pax.name}
                          onChange={(e) => handleUpdatePassenger(idx, 'name', e.target.value)}
                          className="w-full font-bold px-2 py-1 rounded border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[9px] text-slate-400 font-bold block uppercase">Type</label>
                        <input
                          type="text"
                          value={pax.type}
                          onChange={(e) => handleUpdatePassenger(idx, 'type', e.target.value)}
                          className="w-full font-semibold px-2 py-1 rounded border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] text-slate-400 font-bold block uppercase">Seat</label>
                        <input
                          type="text"
                          value={pax.seat}
                          onChange={(e) => handleUpdatePassenger(idx, 'seat', e.target.value)}
                          className="w-full font-bold px-2 py-1 rounded border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end pt-3">
                        {ticket.passengers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePassenger(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Remove passenger"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Fare Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                    Airline Fare & Taxes
                  </label>
                  <input
                    type="text"
                    value={ticket.airlineFareAndTaxes}
                    onChange={(e) => handleUpdateTicketField('airlineFareAndTaxes', e.target.value)}
                    className="w-full font-bold px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                    Total Fare (Printed)
                  </label>
                  <input
                    type="text"
                    value={ticket.totalFare}
                    onChange={(e) => handleUpdateTicketField('totalFare', e.target.value)}
                    className="w-full font-black text-[#078A32] px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Download / View Actions */}
              {brandedPdfUrl && (
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <a
                    href={brandedPdfUrl}
                    download={`TravelBzar_ETicket_${ticket.pnr}.pdf`}
                    className="inline-flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-black text-xs px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Branded PDF</span>
                  </a>

                  <a
                    href={brandedPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview in New Tab</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Branded WhatsApp Summary */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-gradient-to-br from-[#061B33] to-[#0E2A4D] text-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#42B900] animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-[#42B900]">
                  WhatsApp Ticket Message
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
                Travel BZAR Format
              </span>
            </div>

            <textarea
              readOnly
              value={whatsAppSummaryText}
              rows={16}
              placeholder="Upload a PDF ticket on the left to extract the itinerary and generate formatted delivery text..."
              className="w-full font-mono text-xs bg-slate-950/70 text-slate-200 p-4 rounded-2xl border border-slate-700 focus:outline-hidden leading-relaxed resize-none shadow-inner select-all"
            />

            {/* Simplified 2-Button Action Bar: Master Share All + Emergency Copy Text */}
            <div className="space-y-3 pt-2">
              {/* Button 1: Master Share on Phone (PDF Attached + Full Itinerary Text) */}
              <button
                type="button"
                onClick={handleShareAll}
                disabled={!ticket || sharing}
                className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20BA5A] active:scale-95 text-white disabled:opacity-50 text-sm sm:text-base font-black py-4 px-4 rounded-2xl shadow-xl transition-all cursor-pointer border-2 border-emerald-300/40"
              >
                {sharing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Preparing WhatsApp Share...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5 shrink-0" />
                    <span>Share on WhatsApp (PDF + Text)</span>
                  </>
                )}
              </button>

              {/* Button 2: Emergency Copy Text Only */}
              <button
                type="button"
                onClick={handleCopyTextOnly}
                disabled={!ticket}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-white/15 disabled:opacity-50 cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 text-[#42B900]" />
                    <span className="text-[#42B900]">Summary Text Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>Emergency: Copy Text Only</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center pt-1">
              📱 Optimized for mobile: Tapping <strong>Share on WhatsApp</strong> attaches the branded PDF and pastes the itinerary text directly into your chat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
