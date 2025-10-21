import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Super Admin Configuration
export const SUPER_ADMIN_EMAIL = "accizardlucban@gmail.com";

// Map HTTP status codes to human-friendly messages
export function getHttpStatusMessage(status?: number): string {
  switch (status) {
    case 400:
      return "Bad request. Please check your input.";
    case 401:
      return "Unauthorized. Please log in again.";
    case 403:
      return "Forbidden. You don’t have permission to perform this action.";
    case 404:
      return "Resource not found.";
    case 408:
      return "Request timeout. Please try again.";
    case 429:
      return "Too many requests. Please slow down and try again later.";
    case 500:
      return "Server error. Please try again later.";
    case 502:
      return "Bad gateway. Please try again later.";
    case 503:
      return "Service unavailable. Please try again later.";
    case 504:
      return "Gateway timeout. Please check your connection and try again.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

// Throw if response is not ok, attaching status and message
export async function ensureOk(response: Response): Promise<Response> {
  if (!response.ok) {
    const status = response.status;
    let serverMessage: string | undefined;
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        serverMessage = (data && (data.message || data.error || data.detail)) as string | undefined;
      } else {
        serverMessage = await response.text();
      }
    } catch (_) {
      // ignore body parse errors
    }

    const friendly = getHttpStatusMessage(status);
    const message = serverMessage && serverMessage.trim()
      ? `${friendly} (${status}). ${serverMessage}`
      : `${friendly} (${status}).`;
    const error = new Error(message) as Error & { status?: number };
    error.status = status;
    throw error;
  }
  return response;
}