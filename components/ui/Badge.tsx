import React from 'react';
import { BookingStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

/**
 * Badge specifically for booking statuses
 */
export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const variantMap: Record<BookingStatus, BadgeProps['variant']> = {
    confirmed: 'success',
    cancelled: 'error',
    completed: 'info',
  };

  const labelMap: Record<BookingStatus, string> = {
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
  };

  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}