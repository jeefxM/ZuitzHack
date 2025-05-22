import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BountyStatus } from "@/lib/types";

/**
 * Utility function to merge tailwind classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Get status badge variant
 * @param status - Bounty status
 * @returns - Class name
 */
export function getStatusColor(status: BountyStatus): string {
  switch (status) {
    case "open":
      return "bg-green-500";
    case "closed":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

/**
 * Get difficulty badge variant
 * @param difficulty - Bounty difficulty
 * @returns - Class name
 */

/**
 * Format a date string to a more readable format
 * @param dateString - Date string to format
 * @returns - Formatted date
 */
export function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Calculate days remaining until a deadline
 * @param deadline - Deadline date string
 * @returns - Number of days remaining
 */
export function daysRemaining(deadline: string): number {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}
