'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, ArrowRight, ShieldCheck } from 'lucide-react';

export default function OwnerNotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, loading } = useNotifications(user?.id || 'owner');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#078A32]">
            Operations Alerts
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33]">Notifications Center</h1>
        </div>

        {unreadCount > 0 && (
          <span className="bg-[#F0441D] text-white text-xs font-bold px-3 py-1 rounded-full">
            {unreadCount} Unread Alerts
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
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
          <Bell className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Operations Alerts</h3>
          <p className="text-xs text-slate-500">
            Booking requests, cancellations, and trip completion updates will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isForcedUrgent = n.type === 'FORCED_INSURANCE_EXPIRY_10_DAYS' || n.isUrgent;
            const is30DayInsurance = n.type === 'INSURANCE_EXPIRY_30_DAYS';
            const isDriverAuth = n.type === 'DRIVER_AUTH_EXPIRED' || n.type === 'DRIVER_AUTH_EXPIRING';

            return (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isForcedUrgent
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200 shadow-sm'
                    : is30DayInsurance
                    ? 'bg-amber-50 border-amber-300 shadow-xs'
                    : isDriverAuth
                    ? 'bg-orange-50 border-orange-300 shadow-xs'
                    : n.read
                    ? 'bg-white border-slate-200'
                    : 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                      isForcedUrgent
                        ? 'bg-rose-600 text-white animate-pulse'
                        : is30DayInsurance
                        ? 'bg-amber-500 text-white'
                        : isDriverAuth
                        ? 'bg-orange-600 text-white'
                        : 'bg-[#061B33] text-white'
                    }`}
                  >
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{n.title}</h4>
                      {isForcedUrgent && (
                        <span className="text-[9px] font-black uppercase bg-rose-600 text-white px-2 py-0.5 rounded-full">
                          URGENT
                        </span>
                      )}
                      {is30DayInsurance && (
                        <span className="text-[9px] font-black uppercase bg-amber-600 text-white px-2 py-0.5 rounded-full">
                          1-MONTH NOTICE
                        </span>
                      )}
                      {isDriverAuth && (
                        <span className="text-[9px] font-black uppercase bg-orange-600 text-white px-2 py-0.5 rounded-full">
                          CHAUFFEUR AUTH
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{n.body}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      • {new Date(n.createdAt).toLocaleTimeString('en-IN')} IST
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {n.bookingId && (
                    <Link
                      href={`/owner/bookings/${n.bookingId}`}
                      className="text-xs font-bold text-[#078A32] hover:underline flex items-center gap-1"
                    >
                      <span>Review Booking</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {(isForcedUrgent || is30DayInsurance) && (
                    <Link
                      href="/owner/vehicles"
                      className={`text-xs font-black px-3.5 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1 text-white ${
                        isForcedUrgent ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      <span>Renew Insurance</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {isDriverAuth && (
                    <Link
                      href="/owner/drivers"
                      className="text-xs font-black px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors flex items-center gap-1"
                    >
                      <span>Renew Chauffeur</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
