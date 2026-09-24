'use client';

import React from 'react';
import { useBookings } from '@/hooks/useBookings';
import { computeAnalytics, exportBookingsToCSV } from '@/services/analyticsService';
import { Download, TrendingUp, Calendar, CheckCircle2, DollarSign, BarChart2 } from 'lucide-react';

export default function OwnerAnalyticsPage() {
  const { bookings, loading } = useBookings();
  const analytics = computeAnalytics(bookings);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
            Business Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">Revenue & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational financials and trip volume reports for Dhanbad hub.
          </p>
        </div>

        <button
          onClick={() => exportBookingsToCSV(bookings)}
          className="flex items-center gap-2 bg-[#078A32] hover:bg-[#056B27] active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download Bookings CSV</span>
        </button>
      </div>

      {/* 4 Financial Period Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Today’s Revenue
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            ₹{analytics.todayRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{analytics.todayTrips} trips completed</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            This Week
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            ₹{analytics.thisWeekRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{analytics.thisWeekTrips} trips completed</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            This Month
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            ₹{analytics.thisMonthRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{analytics.thisMonthTrips} trips completed</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            All Time Revenue
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#078A32] mt-1">
            ₹{analytics.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{analytics.completedBookings} total trips</div>
        </div>
      </div>

      {/* Revenue Breakdown Table & Bar Graph */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-extrabold uppercase text-[#061B33]">
            Daily Financial Trend (Past 7 Days)
          </h2>
          <span className="text-xs text-slate-400">Values in INR (₹)</span>
        </div>

        <div className="h-60 flex items-end justify-between gap-3 px-2 pt-8">
          {analytics.recentDailyRevenue.map((d) => {
            const maxRev = Math.max(...analytics.recentDailyRevenue.map((r) => r.revenue), 10000);
            const heightPercent = Math.max(10, Math.round((d.revenue / maxRev) * 100));

            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-bold text-slate-600">
                  ₹{d.revenue.toLocaleString('en-IN')}
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[50px] bg-gradient-to-t from-[#061B33] to-[#078A32] rounded-t-xl transition-all shadow-xs"
                />
                <span className="text-xs font-bold text-slate-700">{d.label}</span>
                <span className="text-[10px] text-slate-400">{d.trips} trips</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
