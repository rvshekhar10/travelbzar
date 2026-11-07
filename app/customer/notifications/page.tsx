'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Bell,
  CheckCircle2,
  Clock,
  Car,
  CreditCard,
  XCircle,
  ArrowRight,
  CheckCheck,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { NotificationType } from '@/types';

// Role-tailored icons & color themes for customer notifications
function getNotificationVisual(type: NotificationType) {
  switch (type) {
    case 'DRIVER_ASSIGNED':
    case 'DRIVER_ARRIVING':
      return {
        icon: Car,
        bgClass: 'bg-emerald-100 text-[#078A32]',
        badgeText: 'Chauffeur Update',
      };
    case 'TRIP_STARTED':
      return {
        icon: Car,
        bgClass: 'bg-sky-100 text-sky-700',
        badgeText: 'Ride in Progress',
      };
    case 'TRIP_COMPLETED':
      return {
        icon: CheckCircle2,
        bgClass: 'bg-emerald-100 text-emerald-800',
        badgeText: 'Ride Completed',
      };
    case 'PAYMENT_RECEIVED':
      return {
        icon: CreditCard,
        bgClass: 'bg-green-100 text-green-700',
        badgeText: 'Payment Confirmed',
      };
    case 'BOOKING_CANCELLED':
      return {
        icon: XCircle,
        bgClass: 'bg-rose-100 text-rose-700',
        badgeText: 'Cancelled',
      };
    default:
      return {
        icon: Bell,
        bgClass: 'bg-slate-100 text-slate-700',
        badgeText: 'Booking Update',
      };
  }
}

export default function CustomerNotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead, clearAll, loading } =
    useNotifications(user?.id);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Automatically mark all notifications as read when the customer views this screen
  React.useEffect(() => {
    if (!loading && unreadCount > 0 && user?.id) {
      // Small timeout to give natural visual rendering before clearing badges
      const timer = setTimeout(() => {
        markAllRead();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [loading, unreadCount, user?.id, markAllRead]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#078A32]">
            My Trip Updates & Receipts
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#061B33] mt-1">Notifications</h1>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#078A32]" />
                <span>Mark All Read</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all notification history for your account?')) {
                  clearAll();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-500 text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Filter */}
      {notifications.length > 0 && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-[#061B33] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Updates ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-[#061B33] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#F0441D] text-white text-[10px] rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Content List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#078A32] flex items-center justify-center mx-auto shadow-inner">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900">
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {filter === 'unread'
              ? 'You have read all your trip notifications.'
              : 'You will receive real-time updates here when your booking is accepted, your chauffeur departs, and when your ride completes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const visual = getNotificationVisual(n.type);
            const Icon = visual.icon;

            return (
              <div
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  n.read
                    ? 'bg-white border-slate-200 text-slate-600'
                    : 'bg-emerald-50/50 border-emerald-300 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${visual.bgClass}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 tracking-wider">
                        {visual.badgeText}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#078A32] animate-ping" />
                      )}
                    </div>

                    <h4 className="text-sm font-black text-slate-900 leading-snug">{n.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>

                    <span className="text-[10px] font-medium text-slate-400 block pt-0.5">
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
                    className="self-end sm:self-center shrink-0 inline-flex items-center gap-1.5 bg-[#061B33] hover:bg-[#0B223D] active:scale-95 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <span>View Trip</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
