import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function truncate(str: string, length = 30): string {
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

export const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  successful: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  trialing: "bg-blue-100 text-blue-800",
  paused: "bg-orange-100 text-orange-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
  past_due: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-700",
  refunded: "bg-purple-100 text-purple-800",
};

export function formatToISODateTime(date: Date) {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}T00:00:00`;
}
