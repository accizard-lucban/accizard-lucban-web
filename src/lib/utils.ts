import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Super Admin Configuration
export const SUPER_ADMIN_EMAIL = "accizardlucban@gmail.com";