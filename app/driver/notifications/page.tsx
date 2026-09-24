'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, ArrowRight } from 'lucide-react';

export default function DriverNotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, loading } = useNotifications(user?.id || 'drv-1');

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
            Chauffeur Dispatch
          </span>
          <h1 className="text-2xl font-black text-[#061B33] mt-1">Trip Alerts & Assignments</h1>
        </div>

        {unreadCount > 0 && (
          <span className="bg-[#F0441D] text-white text-xs font-bold px-3 py-1 rounded-full">
            {unreadCount} New
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
          <Bell className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Notifications</h3>
          <p className="text-xs text-slate-500">Trip assignments and updates will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                n.read ? 'bg-white border-slate-200' : 'bg-emerald-50 border-emerald-300 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#061B33] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4 h-4 text-[#42B900]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{n.body}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.createdAt).toLocaleTimeString('en-IN')} IST
                  </span>
                </div>
              </div>

              {n.bookingId && (
                <Link
                  href={`/driver/trip/${n.bookingId}`}
                  className="text-xs font-bold text-[#078A32] hover:underline shrink-0 flex items-center gap-1"
                >
                  <span>Open Trip</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
