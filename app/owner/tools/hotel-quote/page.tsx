'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Hotel,
  Upload,
  Camera,
  Copy,
  Check,
  Share2,
  Sliders,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Eye,
  Calendar,
  Users,
  MapPin,
  Sparkles,
  Percent,
  CheckCircle2,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';
import {
  HotelBookingDetails,
  HotelPricingQuote,
  calculateHotelQuote,
  generateHotelWhatsAppQuoteText,
} from '@/services/hotelQuoteService';
import { generateTravelBzarHotelQuotationPdf } from '@/services/hotelQuotationPdfService';
import { scanHotelImage, fuseDualHotelData } from '@/services/ocrHotelService';
import { getStoredMarkupSettings, MarkupSettings, DEFAULT_MARKUP_SETTINGS } from '@/services/flightQuoteService';

export default function HotelQuoteToolPage() {
  const [settings, setSettings] = useState<MarkupSettings>(DEFAULT_MARKUP_SETTINGS);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [sharing, setSharing] = useState(false);

  // 1. Hotel Details State (initialized empty; populated via screenshot OCR or manual entry)
  const [hotel, setHotel] = useState<HotelBookingDetails>({
    hotelName: '',
    starRating: '',
    location: '',
    checkInDate: '',
    checkInTime: '3:00 PM',
    checkOutDate: '',
    checkOutTime: '12:00 PM',
    nights: 1,
    guestSummary: '',
    adultsCount: 2,
    roomsCount: 1,
    roomType: '',
    mealPlan: '',
    inclusions: [],
    customerAppPrice: 0,
    agentAppPrice: 0,
    customerName: '',
  });

  // Dual Screenshot Previews & OCR States
  const [customerImagePreview, setCustomerImagePreview] = useState<string | null>(null);
  const [agentImagePreview, setAgentImagePreview] = useState<string | null>(null);
  const [customerRawText, setCustomerRawText] = useState<string>('');
  const [agentRawText, setAgentRawText] = useState<string>('');
  const [isProcessingCustomerOcr, setIsProcessingCustomerOcr] = useState(false);
  const [isProcessingAgentOcr, setIsProcessingAgentOcr] = useState(false);

  // Generated Quotation PDF State
  const [quotePdfUrl, setQuotePdfUrl] = useState<string | null>(null);
  const [quotePdfBlob, setQuotePdfBlob] = useState<Blob | null>(null);

  const customerFileInputRef = useRef<HTMLInputElement>(null);
  const agentFileInputRef = useRef<HTMLInputElement>(null);

  // Calculate quote based on exact sharing rule
  const quote = calculateHotelQuote(hotel.customerAppPrice, hotel.agentAppPrice);

  useEffect(() => {
    async function loadSettings() {
      const s = await getStoredMarkupSettings();
      setSettings(s);
    }
    loadSettings();
  }, []);

  // Recalculate quotation PDF on changes (only when hotel has data)
  useEffect(() => {
    async function buildPdf() {
      if (!hotel.hotelName && hotel.customerAppPrice === 0) {
        setQuotePdfBlob(null);
        setQuotePdfUrl(null);
        return;
      }

      try {
        const bytes = await generateTravelBzarHotelQuotationPdf(
          hotel,
          quote,
          settings.agencyName,
          settings.agencyPhone,
          settings.agencyLocation
        );
        const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
        setQuotePdfBlob(blob);
        const url = URL.createObjectURL(blob);
        setQuotePdfUrl(url);
      } catch (err) {
        console.warn('Hotel Quotation PDF generation error:', err);
      }
    }
    buildPdf();
  }, [hotel, quote, settings]);

  // Upload Customer Screenshot
  const handleCustomerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomerImagePreview(URL.createObjectURL(file));
    setIsProcessingCustomerOcr(true);

    try {
      const { text: rawText } = await scanHotelImage(file, 'customer');
      setCustomerRawText(rawText);

      // Fuse data from this customer screenshot + any already-uploaded agent screenshot
      const fused = fuseDualHotelData(rawText, agentRawText);
      setHotel((prev) => ({
        ...prev,
        ...fused,
        customerAppPrice: fused.customerAppPrice || prev.customerAppPrice,
        agentAppPrice: prev.agentAppPrice || fused.agentAppPrice || 0,
        customerName: prev.customerName, // preserve
      }));
    } catch (err) {
      console.error('Customer OCR Error:', err);
      alert('Could not auto-read customer screenshot. Details can be entered or adjusted manually.');
    } finally {
      setIsProcessingCustomerOcr(false);
    }
  };

  // Upload Agent Portal Screenshot
  const handleAgentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAgentImagePreview(URL.createObjectURL(file));
    setIsProcessingAgentOcr(true);

    try {
      const { text: rawText } = await scanHotelImage(file, 'agent');
      setAgentRawText(rawText);

      // Cross-fuse data with the customer screenshot to engineer the true details
      const fused = fuseDualHotelData(customerRawText, rawText);
      setHotel((prev) => ({
        ...prev,
        ...fused,
        customerAppPrice: prev.customerAppPrice || fused.customerAppPrice || 0,
        agentAppPrice: fused.agentAppPrice || prev.agentAppPrice,
        customerName: prev.customerName, // preserve
      }));
    } catch (err) {
      console.error('Agent OCR Error:', err);
      alert('Could not auto-read agent rate. You can manually enter the partner portal rate.');
    } finally {
      setIsProcessingAgentOcr(false);
    }
  };

  const quoteText = generateHotelWhatsAppQuoteText(
    hotel,
    quote,
    settings.agencyName,
    settings.agencyPhone,
    settings.agencyLocation
  );

  // Single-Click Mobile Share Action (PDF + Text Caption)
  const handleShareAll = async () => {
    setSharing(true);
    const fileName = `TravelBzar_HotelQuote_${hotel.hotelName.slice(0, 15).replace(/\s+/g, '_')}.pdf`;

    try {
      if (quotePdfBlob && typeof navigator !== 'undefined' && navigator.canShare) {
        const file = new File([quotePdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Travel BZAR Hotel Quote - ${hotel.hotelName}`,
            text: quoteText,
          });
          setSharing(false);
          return;
        }
      }

      // Desktop fallback
      if (quotePdfUrl) {
        const link = document.createElement('a');
        link.href = quotePdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      const url = `https://wa.me/?text=${encodeURIComponent(quoteText)}`;
      window.open(url, '_blank');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const url = `https://wa.me/?text=${encodeURIComponent(quoteText)}`;
        window.open(url, '_blank');
      }
    } finally {
      setSharing(false);
    }
  };

  const handleCopyTextOnly = async () => {
    await navigator.clipboard.writeText(quoteText);
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
            <span>Owner Commercial Tool #3</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">
            Hotel Rate & Markup Quotation Generator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload screenshots of MMT Customer App and MMT Partner/Agent Portal. Automatically calculates your custom markup sharing rules and generates branded quotation PDF & WhatsApp message.
          </p>
        </div>

        <Link
          href="/owner/tools/flight-quote"
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all"
        >
          <span>Switch to Flight Quote OCR</span>
          &rarr;
        </Link>
      </div>

      {/* 2 Portal Uploaders Side-by-Side: Customer App vs Agent Portal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Upload 1: Customer Portal Screenshot */}
        <div
          onClick={() => customerFileInputRef.current?.click()}
          className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 p-5 rounded-3xl text-center cursor-pointer transition-all space-y-2 relative overflow-hidden"
        >
          <input
            ref={customerFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCustomerUpload}
          />
          {customerImagePreview ? (
            <div className="space-y-1">
              <img
                src={customerImagePreview}
                alt="MMT Customer Screenshot"
                className="max-h-36 mx-auto rounded-xl object-contain shadow-sm border border-slate-200"
              />
              <span className="text-[11px] font-bold text-blue-600 block">Click to replace Customer Screenshot</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-2xl bg-white text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-900">1. MMT Customer App Screenshot</h3>
              <p className="text-[11px] text-slate-500">Extracts Hotel name, room, dates, and public portal price</p>
            </>
          )}

          {isProcessingCustomerOcr && (
            <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-3 space-y-2">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-xs font-black text-slate-800">Reading Customer Rates & Dates...</span>
            </div>
          )}
        </div>

        {/* Upload 2: Agent Portal Screenshot */}
        <div
          onClick={() => agentFileInputRef.current?.click()}
          className="border-2 border-dashed border-emerald-400 hover:border-[#078A32] bg-emerald-50/40 p-5 rounded-3xl text-center cursor-pointer transition-all space-y-2 relative overflow-hidden"
        >
          <input
            ref={agentFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAgentUpload}
          />
          {agentImagePreview ? (
            <div className="space-y-1">
              <img
                src={agentImagePreview}
                alt="MMT Agent Screenshot"
                className="max-h-36 mx-auto rounded-xl object-contain shadow-sm border border-slate-200"
              />
              <span className="text-[11px] font-bold text-[#078A32] block">Click to replace Agent Screenshot</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-2xl bg-white text-[#078A32] flex items-center justify-center mx-auto shadow-sm">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-900">2. MMT Agent / Partner Screenshot</h3>
              <p className="text-[11px] text-slate-500">Extracts lower confidential B2B partner price</p>
            </>
          )}

          {isProcessingAgentOcr && (
            <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-3 space-y-2">
              <RefreshCw className="w-5 h-5 text-[#078A32] animate-spin" />
              <span className="text-xs font-black text-slate-800">Reading Partner B2B Price...</span>
            </div>
          )}
        </div>
      </div>

      {/* Markup Rules Logic Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-teal-500/10 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-[#078A32]" />
          <div>
            <span className="font-bold text-slate-900 block">Markup Sharing Policy Active:</span>
            <span className="text-[11px] text-slate-600">
              Customer receives up to max 20% off. If margin &le; 40%, profit & discount are split 50-50 equally.
            </span>
          </div>
        </div>
        <div className="text-right font-black">
          <span className="text-xs text-[#078A32] block">Customer Off: {quote.customerDiscountPercent}%</span>
          <span className="text-[10px] text-slate-500">Owner Profit: {quote.ownerProfitPercent}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Details & Pricing Breakdown */}
        <div className="lg:col-span-7 space-y-5">
          {/* Rate Comparison Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <span className="text-xs font-black uppercase text-slate-800 tracking-wider block border-b border-slate-100 pb-2">
              Rate Comparison & Auto-Calculated Quotation
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                  Customer App Price (MMT)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={hotel.customerAppPrice}
                    onChange={(e) => setHotel({ ...hotel, customerAppPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-6 pr-3 py-2 font-bold rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                  Partner / Agent Price (MMT)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={hotel.agentAppPrice}
                    onChange={(e) => setHotel({ ...hotel, agentAppPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-6 pr-3 py-2 font-bold rounded-xl border border-slate-300 text-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#078A32] font-black block uppercase mb-1">
                  Final Quoted Price (Client)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-[#078A32] font-black">₹</span>
                  <input
                    type="number"
                    readOnly
                    value={quote.quotedPrice}
                    className="w-full pl-6 pr-3 py-2 font-black text-sm text-[#078A32] rounded-xl border border-emerald-300 bg-emerald-50/50"
                  />
                </div>
              </div>
            </div>

            {/* Profit Margin Details */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Total Difference</span>
                <span className="font-bold text-slate-800">₹{quote.diffAmount.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-slate-400 block">({quote.totalDiffPercent}%)</span>
              </div>
              <div>
                <span className="text-[10px] text-[#078A32] font-bold block uppercase">Client Discount</span>
                <span className="font-black text-[#078A32]">-₹{quote.customerDiscountAmount.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-[#078A32] block">({quote.customerDiscountPercent}% OFF)</span>
              </div>
              <div>
                <span className="text-[10px] text-blue-700 font-bold block uppercase">Your Profit Margin</span>
                <span className="font-black text-blue-900">+₹{quote.ownerProfitAmount.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-blue-700 block">({quote.ownerProfitPercent}% Net)</span>
              </div>
            </div>
          </div>

          {/* Hotel & Reservation Metadata Form */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <span className="text-xs font-black uppercase text-slate-800 tracking-wider block border-b border-slate-100 pb-2">
              Hotel & Stay Details (Editable)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Hotel Name</label>
                <input
                  type="text"
                  value={hotel.hotelName}
                  onChange={(e) => setHotel({ ...hotel, hotelName: e.target.value })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Location / Address</label>
                <input
                  type="text"
                  value={hotel.location}
                  onChange={(e) => setHotel({ ...hotel, location: e.target.value })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Star Category</label>
                <input
                  type="text"
                  value={hotel.starRating || ''}
                  onChange={(e) => setHotel({ ...hotel, starRating: e.target.value })}
                  placeholder="e.g. 5 Star Luxury Hotel"
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Check-In</label>
                <input
                  type="text"
                  value={hotel.checkInDate}
                  onChange={(e) => setHotel({ ...hotel, checkInDate: e.target.value })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Check-Out</label>
                <input
                  type="text"
                  value={hotel.checkOutDate}
                  onChange={(e) => setHotel({ ...hotel, checkOutDate: e.target.value })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Stay Duration</label>
                <input
                  type="number"
                  min="1"
                  value={hotel.nights}
                  onChange={(e) => setHotel({ ...hotel, nights: parseInt(e.target.value, 10) || 1 })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Guests & Rooms Summary</label>
                <input
                  type="text"
                  value={hotel.guestSummary}
                  onChange={(e) => setHotel({ ...hotel, guestSummary: e.target.value })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Room Category</label>
                <input
                  type="text"
                  value={hotel.roomType}
                  onChange={(e) => setHotel({ ...hotel, roomType: e.target.value })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Meal Plan</label>
                <input
                  type="text"
                  value={hotel.mealPlan}
                  onChange={(e) => setHotel({ ...hotel, mealPlan: e.target.value })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Client Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Amit Khanna"
                  value={hotel.customerName || ''}
                  onChange={(e) => setHotel({ ...hotel, customerName: e.target.value })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Download & Preview PDF Bar */}
          {quotePdfUrl && (
            <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-slate-900 block">Travel BZAR Branded Hotel Quotation PDF</span>
                <span className="text-[11px] text-slate-500">Includes corporate privilege pricing and luxury inclusions.</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={quotePdfUrl}
                  download={`TravelBzar_Hotel_${hotel.hotelName.slice(0, 15).replace(/\s+/g, '_')}.pdf`}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
                <a
                  href={quotePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview PDF</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Branded WhatsApp Quotation Message */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-gradient-to-br from-[#061B33] to-[#0E2A4D] text-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#42B900] animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-[#42B900]">
                  WhatsApp Hotel Quote
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
                Travel BZAR Format
              </span>
            </div>

            <textarea
              readOnly
              value={quoteText}
              rows={16}
              placeholder="Upload screenshots on the left to calculate discount and generate quotation message..."
              className="w-full font-mono text-xs bg-slate-950/70 text-slate-200 p-4 rounded-2xl border border-slate-700 focus:outline-hidden leading-relaxed resize-none shadow-inner select-all"
            />

            {/* 2-Button Mobile Action Bar: Share on WhatsApp (PDF + Text) & Emergency Copy */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleShareAll}
                disabled={sharing}
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

              <button
                type="button"
                onClick={handleCopyTextOnly}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-white/15 disabled:opacity-50 cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 text-[#42B900]" />
                    <span className="text-[#42B900]">Hotel Quotation Copied!</span>
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
              📱 Optimized for mobile: Tapping <strong>Share on WhatsApp</strong> attaches the branded quotation PDF and pre-fills the message in your chat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

