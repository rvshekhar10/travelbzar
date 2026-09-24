'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, CheckCircle2, Clock, Calendar, ArrowRight } from 'lucide-react';

export default function CustomerNotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, loading } = useNotifications(user?.id);

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
            Updates & Alerts
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33] mt-1">Notifications</h1>
        </div>

        {unreadCount > 0 && (
          <span className="bg-[#F0441D] text-white text-xs font-bold px-3 py-1 rounded-full">
            {unreadCount} Unread
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No notifications yet</h3>
          <p className="text-xs text-slate-500">
            You will receive updates when your booking is confirmed, driver assigned, and when your ride begins.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                n.read
                  ? 'bg-white border-slate-200 text-slate-600'
                  : 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    n.read ? 'bg-slate-100 text-slate-500' : 'bg-[#078A32] text-white'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.body}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.createdAt).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    IST
                  </span>
                </div>
              </div>

              {n.bookingId && (
                <Link
                  href={`/customer/bookings/${n.bookingId}`}
                  className="text-xs font-bold text-[#078A32] hover:underline shrink-0 flex items-center gap-1 mt-1"
                >
                  <span>View</span>
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
