'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Copy,
  Check,
  Share2,
  Sliders,
  Plane,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Eye,
  FileText,
  Calendar,
  Users,
  MapPin,
  Sparkles,
} from 'lucide-react';
import {
  MarkupSettings,
  DEFAULT_MARKUP_SETTINGS,
  getStoredMarkupSettings,
  saveStoredMarkupSettings,
  TripHeaderDetails,
  ExtractedFlightOption,
  generateWhatsAppQuoteText,
  calculateQuotedFare,
  getCancellationFee,
} from '@/services/flightQuoteService';
import { extractFlightDataFromImageFile } from '@/services/ocrFlightService';
import { generateTravelBzarQuotationPdf } from '@/services/flightQuotationPdfService';

export default function FlightQuoteToolPage() {
  const [settings, setSettings] = useState<MarkupSettings>(DEFAULT_MARKUP_SETTINGS);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [sharing, setSharing] = useState(false);

  // 1. Trip Header Form State (Starts clean and unpopulated until image upload or manual input)
  const [trip, setTrip] = useState<TripHeaderDetails>({
    tripType: 'one-way',
    fromCity: '',
    toCity: '',
    departDate: '',
    returnDate: '',
    passengerCount: 1,
    cabinClass: 'Economy',
    customerName: '',
  });

  // 2. Flight Options List (Starts empty - no prefilled mock data)
  const [flightOptions, setFlightOptions] = useState<ExtractedFlightOption[]>([]);

  // OCR Processing State
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Generated Quotation PDF State
  const [quotePdfUrl, setQuotePdfUrl] = useState<string | null>(null);
  const [quotePdfBlob, setQuotePdfBlob] = useState<Blob | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      const s = await getStoredMarkupSettings();
      setSettings(s);
    }
    loadSettings();
  }, []);

  // Recalculate quotation PDF whenever flights, trip, or markup settings update
  useEffect(() => {
    async function buildPdf() {
      if (flightOptions.length === 0) return;
      try {
        const bytes = await generateTravelBzarQuotationPdf(trip, flightOptions, settings);
        const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
        setQuotePdfBlob(blob);
        const url = URL.createObjectURL(blob);
        setQuotePdfUrl(url);
      } catch (err) {
        console.warn('Quotation PDF generation error:', err);
      }
    }
    buildPdf();
  }, [trip, flightOptions, settings]);

  const handleSaveSettings = async (updated: MarkupSettings) => {
    setSettings(updated);
    await saveStoredMarkupSettings(updated);
    setShowSettingsModal(false);
  };

  // Image Upload & High-Accuracy OCR
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreviewUrl(URL.createObjectURL(file));
    setIsProcessingOcr(true);
    setOcrProgress(15);
    setOcrStatusText('Analyzing image & route...');

    try {
      const parsed = await extractFlightDataFromImageFile(file, (progress, status) => {
        setOcrProgress(progress);
        setOcrStatusText(status);
      });

      // Update trip state directly with extracted details
      setTrip((prev) => ({
        ...prev,
        tripType: parsed.trip.tripType || prev.tripType,
        fromCity: parsed.trip.fromCity || prev.fromCity,
        toCity: parsed.trip.toCity || prev.toCity,
        departDate: parsed.trip.departDate || prev.departDate,
        returnDate: parsed.trip.returnDate || prev.returnDate,
        passengerCount: parsed.trip.passengerCount || prev.passengerCount,
        cabinClass: parsed.trip.cabinClass || prev.cabinClass,
        customerName: prev.customerName, // preserve entered customer name
      }));

      // Apply markup settings to calculate each flight tier's offer price
      const flightsWithMarkup = parsed.flights.map((f) => {
        const { finalFare } = calculateQuotedFare(f.baseFare, f.fareCategory, settings);
        return {
          ...f,
          offerPrice: finalFare,
        };
      });

      if (flightsWithMarkup.length > 0) {
        setFlightOptions(flightsWithMarkup);
      }
    } catch (err) {
      console.error('OCR Extraction error:', err);
      alert('Could not auto-read text from image. You can adjust details manually.');
    } finally {
      setIsProcessingOcr(false);
    }
  };

  // Flight option management
  const handleAddOption = () => {
    const defaultBase = 5000;
    const { finalFare } = calculateQuotedFare(defaultBase, 'value', settings);
    setFlightOptions((prev) => [
      ...prev,
      {
        airline: 'IndiGo',
        flightNumber: '6E 5218',
        departureTime: '11:30',
        arrivalTime: '13:40',
        duration: '2h 10m',
        stops: 'Non-stop',
        baseFare: defaultBase,
        offerPrice: finalFare,
        fareCategory: 'value',
        cabinBaggage: '7 Kg',
        checkInBaggage: '15 Kg',
      },
    ]);
  };

  const handleUpdateOption = (index: number, field: keyof ExtractedFlightOption, value: any) => {
    setFlightOptions((prev) => {
      const copy = [...prev];
      const updated = { ...copy[index], [field]: value };

      // If baseFare or fareCategory changed, automatically recalculate offerPrice using markup settings
      if (field === 'baseFare' || field === 'fareCategory') {
        const { finalFare } = calculateQuotedFare(
          field === 'baseFare' ? Number(value) : updated.baseFare,
          field === 'fareCategory' ? value : updated.fareCategory,
          settings
        );
        updated.offerPrice = finalFare;
      }

      copy[index] = updated;
      return copy;
    });
  };

  const handleRemoveOption = (index: number) => {
    if (flightOptions.length <= 1) return;
    setFlightOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const quoteText = generateWhatsAppQuoteText(trip, flightOptions, settings);

  // Mobile Single-Button Share Action (PDF + Text Caption)
  const handleShareAll = async () => {
    if (flightOptions.length === 0) return;
    setSharing(true);

    const fileName = `TravelBzar_Quotation_${trip.fromCity.slice(0, 3)}_${trip.toCity.slice(0, 3)}.pdf`;

    try {
      if (quotePdfBlob && typeof navigator !== 'undefined' && navigator.canShare) {
        const file = new File([quotePdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Travel BZAR Flight Quote - ${trip.fromCity} to ${trip.toCity}`,
            text: quoteText,
          });
          setSharing(false);
          return;
        }
      }

      // Fallback: download PDF & open WhatsApp
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

  // Emergency Copy Text Button
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
            <span>Owner Commercial Tool #1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">
            Image to Flight Quote Generator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload screenshot of flight search. Automatically extracts trip route, dates, passenger count, and flight options, applying your configured markups into a branded quotation PDF and WhatsApp message.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/owner/tools/markup-settings"
            className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-[#078A32] border border-emerald-300 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <Sliders className="w-4 h-4 text-[#078A32]" />
            <span>Markup Settings</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span>Quick Edit</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Portal Upload, Trip Header & Flight Options */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Portal Screenshot Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-400 hover:border-[#078A32] bg-emerald-50/50 hover:bg-emerald-50 p-6 rounded-3xl text-center cursor-pointer transition-all space-y-3 relative overflow-hidden"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {imagePreviewUrl ? (
              <div className="space-y-2">
                <img
                  src={imagePreviewUrl}
                  alt="Uploaded Portal"
                  className="max-h-40 mx-auto rounded-xl object-contain shadow-md border border-slate-200"
                />
                <span className="text-[11px] font-bold text-[#078A32] block">
                  Click to replace portal screenshot
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-white text-[#078A32] flex items-center justify-center mx-auto shadow-sm">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Upload Partner Portal Rates Screenshot
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Snap or upload flight search results from partner portal. Instant OCR recognition.
                  </p>
                </div>
              </>
            )}

            {isProcessingOcr && (
              <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-4 space-y-2">
                <RefreshCw className="w-6 h-6 text-[#078A32] animate-spin" />
                <span className="text-xs font-black text-slate-800">{ocrStatusText}</span>
                <div className="w-48 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#078A32] h-full transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Trip Metadata Bar (Trip type, from, to, depart date, return date, pax, class) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#078A32]" />
                Trip & Route Details
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTrip((p) => ({ ...p, tripType: 'one-way' }))}
                  className={`text-[11px] font-black px-3 py-1 rounded-lg transition-all ${
                    trip.tripType === 'one-way' ? 'bg-[#078A32] text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  One Way
                </button>
                <button
                  type="button"
                  onClick={() => setTrip((p) => ({ ...p, tripType: 'return' }))}
                  className={`text-[11px] font-black px-3 py-1 rounded-lg transition-all ${
                    trip.tripType === 'return' ? 'bg-[#078A32] text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Return / Round Trip
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">From City / Code</label>
                <input
                  type="text"
                  value={trip.fromCity}
                  onChange={(e) => setTrip({ ...trip, fromCity: e.target.value })}
                  placeholder="e.g. Ranchi (IXR)"
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">To City / Code</label>
                <input
                  type="text"
                  value={trip.toCity}
                  onChange={(e) => setTrip({ ...trip, toCity: e.target.value })}
                  placeholder="e.g. Delhi (DEL)"
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Departure Date</label>
                <input
                  type="text"
                  value={trip.departDate}
                  onChange={(e) => setTrip({ ...trip, departDate: e.target.value })}
                  placeholder="25 Aug 2026"
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {trip.tripType === 'return' && (
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Return Date</label>
                  <input
                    type="text"
                    value={trip.returnDate || ''}
                    onChange={(e) => setTrip({ ...trip, returnDate: e.target.value })}
                    placeholder="30 Aug 2026"
                    className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Passengers (Pax)</label>
                <select
                  value={trip.passengerCount}
                  onChange={(e) => setTrip({ ...trip, passengerCount: parseInt(e.target.value, 10) })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} Passenger{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Travel Class</label>
                <select
                  value={trip.cabinClass}
                  onChange={(e) => setTrip({ ...trip, cabinClass: e.target.value as any })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                >
                  <option value="Economy">Economy</option>
                  <option value="Premium Economy">Premium Economy</option>
                  <option value="Business">Business</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Customer / Client Name (Optional)</label>
              <input
                type="text"
                value={trip.customerName || ''}
                onChange={(e) => setTrip({ ...trip, customerName: e.target.value })}
                placeholder="e.g. Mr. Rajesh Sharma"
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          {/* 3. List of Flights (Dep time, Arr time, Base Price, Offer Price, Markup) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                Flight Options ({flightOptions.length})
              </span>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs font-bold text-[#078A32] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Flight Option</span>
              </button>
            </div>

            {flightOptions.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-2">
                <Plane className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No flight options loaded yet</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Upload a flight partner screenshot above to automatically populate routes, timings, and prices, or click <strong>Add Flight Option</strong> to create one manually.
                </p>
              </div>
            ) : (
              flightOptions.map((opt, idx) => {
              const { finalFare, markupApplied } = calculateQuotedFare(opt.baseFare, opt.fareCategory, settings);
              const cancel = getCancellationFee(opt.airline, opt.fareCategory, settings);
              const offerPrice = opt.offerPrice && opt.offerPrice > 0 ? opt.offerPrice : finalFare;

              return (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-900">
                      Option {idx + 1} &middot; {opt.airline}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                      title="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Operating Airline</label>
                      <input
                        type="text"
                        value={opt.airline}
                        onChange={(e) => handleUpdateOption(idx, 'airline', e.target.value)}
                        className="w-full font-bold px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Flight Number</label>
                      <input
                        type="text"
                        value={opt.flightNumber}
                        onChange={(e) => handleUpdateOption(idx, 'flightNumber', e.target.value)}
                        className="w-full font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Depart Time</label>
                      <input
                        type="text"
                        value={opt.departureTime}
                        onChange={(e) => handleUpdateOption(idx, 'departureTime', e.target.value)}
                        className="w-full font-bold px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Arrival Time</label>
                      <input
                        type="text"
                        value={opt.arrivalTime}
                        onChange={(e) => handleUpdateOption(idx, 'arrivalTime', e.target.value)}
                        className="w-full font-bold px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  {/* Pricing & Offer Price Grid */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-center">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block uppercase mb-1">Fare Category</label>
                      <select
                        value={opt.fareCategory}
                        onChange={(e) => handleUpdateOption(idx, 'fareCategory', e.target.value)}
                        className="w-full font-bold px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="value">Value Fare (+₹{settings.valueMarkup})</option>
                        <option value="sme">SME Corporate (+₹{settings.smeMarkup})</option>
                        <option value="classic">Classic Fare (+₹{settings.classicMarkup})</option>
                        <option value="flex">Flexi Plus (+₹{settings.flexMarkup})</option>
                        <option value="special_non_refundable">Special Non-Refundable (+₹{settings.specialNonRefundableMarkup})</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block uppercase mb-1">Portal Rate (Base)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          value={opt.baseFare}
                          onChange={(e) => handleUpdateOption(idx, 'baseFare', parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 font-bold rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#078A32] font-black block uppercase mb-1">
                        Offer Price (Base + Markup)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs font-bold text-[#078A32]">₹</span>
                        <input
                          type="number"
                          value={offerPrice}
                          onChange={(e) => handleUpdateOption(idx, 'offerPrice', parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 font-black text-[#078A32] rounded-lg border border-emerald-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Inclusions: Cabin {opt.cabinBaggage || '7 Kg'} &middot; Check-in {opt.checkInBaggage || '15 Kg'}</span>
                    <span className="font-bold text-slate-700">Cancellation: {cancel.note}</span>
                  </div>
                </div>
              );
            }))}
          </div>

          {/* Download & Preview PDF Bar */}
          {quotePdfUrl && (
            <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-slate-900 block">Travel BZAR Branded Quotation PDF</span>
                <span className="text-[11px] text-slate-500">Auto-generated with live route, pricing & cancellation terms.</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={quotePdfUrl}
                  download={`TravelBzar_Quote_${trip.fromCity.slice(0, 3)}_${trip.toCity.slice(0, 3)}.pdf`}
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

        {/* Right Column: Branded WhatsApp Quotation Text & 2-Button Action Bar */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-gradient-to-br from-[#061B33] to-[#0E2A4D] text-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#42B900] animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-[#42B900]">
                  WhatsApp Quotation Message
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
              placeholder="Upload partner screenshot on the left to extract flight options and generate quotation text..."
              className="w-full font-mono text-xs bg-slate-950/70 text-slate-200 p-4 rounded-2xl border border-slate-700 focus:outline-hidden leading-relaxed resize-none shadow-inner select-all"
            />

            {/* 2-Button Mobile Action Bar: Share on WhatsApp (PDF + Text) & Emergency Copy */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleShareAll}
                disabled={flightOptions.length === 0 || sharing}
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
                disabled={flightOptions.length === 0}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-white/15 disabled:opacity-50 cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 text-[#42B900]" />
                    <span className="text-[#42B900]">Quotation Text Copied!</span>
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

      {/* Quick Edit Settings Modal */}
      {showSettingsModal && (
        <QuickSettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}

function QuickSettingsModal({
  settings,
  onSave,
  onClose,
}: {
  settings: MarkupSettings;
  onSave: (updated: MarkupSettings) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<MarkupSettings>(settings);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="font-black text-slate-900 block text-base">Quick Markup Settings</span>
            <span className="text-xs text-slate-500">Changes sync directly to Firestore</span>
          </div>
          <Link
            href="/owner/tools/markup-settings"
            className="text-xs font-bold text-[#078A32] hover:underline"
          >
            Full Page &rarr;
          </Link>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="space-y-4 text-xs"
        >
          <div className="space-y-2">
            <span className="font-bold text-slate-700 block">Fare Category Markups (₹)</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Value Fare (+₹)</span>
                <input
                  type="number"
                  value={form.valueMarkup}
                  onChange={(e) => setForm({ ...form, valueMarkup: parseFloat(e.target.value) || 0 })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">SME Corporate (+₹)</span>
                <input
                  type="number"
                  value={form.smeMarkup}
                  onChange={(e) => setForm({ ...form, smeMarkup: parseFloat(e.target.value) || 0 })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Classic Fare (+₹)</span>
                <input
                  type="number"
                  value={form.classicMarkup}
                  onChange={(e) => setForm({ ...form, classicMarkup: parseFloat(e.target.value) || 0 })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Flex Fare (+₹)</span>
                <input
                  type="number"
                  value={form.flexMarkup}
                  onChange={(e) => setForm({ ...form, flexMarkup: parseFloat(e.target.value) || 0 })}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#078A32] hover:bg-[#056B27] text-white font-black shadow-md cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
