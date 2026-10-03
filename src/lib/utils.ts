// src/lib/utils.ts - Utility functions
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Get status color class based on status string
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Green - Good/Completed
    PAID: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-green-100 text-green-800',
    ACTIVE: 'bg-green-100 text-green-800',
    VERIFIED: 'bg-green-100 text-green-800',
    APPROVED: 'bg-green-100 text-green-800',
    DELIVERED: 'bg-green-100 text-green-800',

    // Yellow - Pending/Warning
    PENDING: 'bg-yellow-100 text-yellow-800',
    BOOKED: 'bg-blue-100 text-blue-800',
    IN_TRANSIT: 'bg-blue-100 text-blue-800',
    INVOICED: 'bg-yellow-100 text-yellow-800',
    UNPAID: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-yellow-100 text-yellow-800',
    UPLOADED: 'bg-blue-100 text-blue-800',
    UPCOMING: 'bg-blue-100 text-blue-800',
    DUE_SOON: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    OPEN: 'bg-blue-100 text-blue-800',

    // Red - Alert/Overdue
    OVERDUE: 'bg-red-100 text-red-800',
    MISSING: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    REJECTED: 'bg-red-100 text-red-800',
    RESOLVED: 'bg-green-100 text-green-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diff = date2.getTime() - date1.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days overdue (negative = not due yet)
 */
export function daysOverdue(dueDate: Date | string): number {
  return daysBetween(new Date(dueDate), new Date());
}

/**
 * Generate a load number: e.g., LD-2024-0001
 */
export function generateLoadNumber(count: number): string {
  const year = new Date().getFullYear();
  return `LD-${year}-${String(count).padStart(4, '0')}`;
}

/**
 * Generate an invoice number: e.g., INV-2024-0001
 */
export function generateInvoiceNumber(count: number): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count).padStart(4, '0')}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Get aging bucket for invoices
 */
export function getAgingBucket(daysOverdue: number): string {
  if (daysOverdue <= 0) return 'Current';
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

/**
 * Calculate rate per mile
 */
export function calculateRatePerMile(grossRate: number, miles: number): number {
  if (miles === 0) return 0;
  return Number((grossRate / miles).toFixed(2));
}

/**
 * Calculate estimated net profit for a load
 */
export function calculateNetProfit(
  grossRate: number,
  driverShare: number,
  commission: number,
  fuelCost: number,
  tolls: number,
  lumperFee: number,
  otherCosts: number
): number {
  return grossRate - driverShare - commission - fuelCost - tolls - lumperFee - otherCosts;
}
