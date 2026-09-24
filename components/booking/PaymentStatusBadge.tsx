import React from 'react';
import { PaymentStatus } from '@/types';
import { Check, Clock, AlertTriangle, X } from 'lucide-react';

interface Props {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

export const PaymentStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';

  const styles: Record<PaymentStatus, { bg: string; text: string; border: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
    PAID: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
      label: 'PAID',
      icon: Check,
    },
    PENDING: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-300',
      label: 'PAYMENT PENDING',
      icon: Clock,
    },
    PARTIALLY_PAID: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-300',
      label: 'PARTIAL',
      icon: AlertTriangle,
    },
    REFUNDED: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-300',
      label: 'REFUNDED',
      icon: AlertTriangle,
    },
    CANCELLED: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-300',
      label: 'CANCELLED',
      icon: X,
    },
  };

  const current = styles[status] || styles.PENDING;
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-md border ${current.bg} ${
        current.text
      } ${current.border} ${isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'}`}
    >
      <Icon className={isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      <span>{current.label}</span>
    </span>
  );
};
