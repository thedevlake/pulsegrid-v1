import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures a date string is treated as UTC if it doesn't have timezone info
 * @param dateString - ISO date string from the backend
 * @returns Date string with UTC timezone indicator
 */
function ensureUTC(dateString: string): string {
  // If it already has timezone info (Z or +/-), return as is
  if (dateString.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateString)) {
    return dateString
  }
  // If it ends with just numbers (no timezone), append Z to indicate UTC
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(dateString)) {
    return dateString + 'Z'
  }
  return dateString
}

/**
 * Formats a date string (assumed to be in UTC) to the user's local timezone
 * @param dateString - ISO date string from the backend (UTC)
 * @param formatString - date-fns format string (default: "MMM dd, yyyy HH:mm:ss")
 * @returns Formatted date string in user's local timezone
 */
export function formatDate(
  dateString: string | null | undefined,
  formatString: string = "MMM dd, yyyy HH:mm:ss"
): string {
  if (!dateString) return "-"
  
  try {
    // Ensure the date string is treated as UTC
    const utcString = ensureUTC(dateString)
    const date = new Date(utcString)
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "-"
    }
    
    // Format using date-fns which will automatically use the user's local timezone
    return format(date, formatString)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "-"
  }
}

/**
 * Formats a date to locale string (for simple date displays)
 * @param dateString - ISO date string from the backend (UTC)
 * @returns Formatted date string in user's local timezone
 */
export function formatDateLocale(dateString: string | null | undefined): string {
  if (!dateString) return "-"
  
  try {
    const utcString = ensureUTC(dateString)
    const date = new Date(utcString)
    if (isNaN(date.getTime())) {
      return "-"
    }
    return date.toLocaleDateString()
  } catch (error) {
    console.error("Error formatting date:", error)
    return "-"
  }
}

/**
 * Formats a date to locale string with time
 * @param dateString - ISO date string from the backend (UTC)
 * @returns Formatted date string with time in user's local timezone
 */
export function formatDateTimeLocale(dateString: string | null | undefined): string {
  if (!dateString) return "-"
  
  try {
    const utcString = ensureUTC(dateString)
    const date = new Date(utcString)
    if (isNaN(date.getTime())) {
      return "-"
    }
    return date.toLocaleString()
  } catch (error) {
    console.error("Error formatting date:", error)
    return "-"
  }
}
