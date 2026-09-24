'use client';

import React, { useState } from 'react';
import { BUSINESS_CONFIG } from '@/config/business';
import { Phone, MessageSquare, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-black uppercase tracking-widest text-[#078A32] bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
          We Are Here 24×7
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#061B33] mt-4">
          Contact Travel BZAR
        </h1>
        <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
          Need an immediate airport pickup, corporate booking, or package consultation? Reach out directly
          via phone, WhatsApp, or through the online inquiry form.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Contact info cards */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#078A32] flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Direct Dispatch Hotline</h3>
              <p className="text-xs text-slate-500 mt-0.5">Available 24 hours / 7 days a week</p>
              <a
                href={`tel:${BUSINESS_CONFIG.contact.phone.replace(/\s+/g, '')}`}
                className="text-lg font-black text-[#078A32] mt-1.5 inline-block hover:underline"
              >
                {BUSINESS_CONFIG.contact.phone}
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">WhatsApp Instant Booking</h3>
              <p className="text-xs text-slate-500 mt-0.5">Share pickup details & flight tickets</p>
              <a
                href={`https://wa.me/919007210697?text=Hello%20Travel%20Bzar%2C%20I%20want%20to%20book%20a%20cab.`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-bold text-[#078A32] mt-1.5 inline-block hover:underline"
              >
                Chat on WhatsApp →
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Location</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dhanbad Junction Area, Katras Road, Dhanbad, Jharkhand 826001
              </p>
            </div>
          </div>
        </div>

        {/* Online Inquiry Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          {submitted ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#078A32] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#061B33]">Message Received</h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Our operations desk will call you back shortly. For urgent rides, please call +91 9007210697.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#061B33] uppercase tracking-wider mb-2">
                Send an Inquiry
              </h3>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Singh"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Message / Requirements</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us about your trip: date, pickup point, destination, or questions..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#078A32]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
