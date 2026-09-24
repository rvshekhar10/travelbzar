import React from 'react';
import { BookingStatus } from '@/types';
import { Clock, CheckCircle2, Car, Navigation, MapPin, Flag, CheckCheck, XCircle } from 'lucide-react';

interface Props {
  status: BookingStatus;
  size?: 'sm' | 'md';
}

export const BookingStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';

  const config: Record<
    BookingStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    PENDING_CONFIRMATION: {
      label: 'PENDING CONFIRMATION',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      icon: Clock,
    },
    CONFIRMED: {
      label: 'CONFIRMED',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      icon: CheckCircle2,
    },
    DRIVER_ASSIGNED: {
      label: 'DRIVER ASSIGNED',
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-300',
      icon: Car,
    },
    DRIVER_EN_ROUTE: {
      label: 'DRIVER EN ROUTE',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-300',
      icon: Navigation,
    },
    DRIVER_ARRIVED: {
      label: 'DRIVER ARRIVED',
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-300',
      icon: MapPin,
    },
    TRIP_STARTED: {
      label: 'TRIP IN PROGRESS',
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-300',
      icon: Flag,
    },
    TRIP_COMPLETED: {
      label: 'TRIP COMPLETED',
      bg: 'bg-green-100',
      text: 'text-green-900',
      border: 'border-green-400',
      icon: CheckCheck,
    },
    CANCELLED: {
      label: 'CANCELLED',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-300',
      icon: XCircle,
    },
    REJECTED: {
      label: 'REJECTED',
      bg: 'bg-red-50',
      text: 'text-red-800',
      border: 'border-red-300',
      icon: XCircle,
    },
  };

  const item = config[status] || config.PENDING_CONFIRMATION;
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border shadow-2xs ${
        item.bg
      } ${item.text} ${item.border} ${isSm ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}`}
    >
      <Icon className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{item.label}</span>
    </span>
  );
};
