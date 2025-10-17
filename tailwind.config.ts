
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'dm-sans': ['DM Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
				sans: ['DM Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
			},
			colors: {
				// UI Foundation Colors (using direct hex values)
				border: '#e5e7eb',       // gray-200
				input: '#e5e7eb',        // gray-200
				ring: '#1f2937',         // gray-800
				background: '#ffffff',   // white
				foreground: '#1f2937',   // gray-800
				
				// Primary = AcciZard Brand Orange
				primary: {
					DEFAULT: '#f97316',  // brand-orange
					foreground: '#ffffff' // white text on orange
				},
				
				// Secondary = AcciZard Brand Red
				secondary: {
					DEFAULT: '#991b1b',  // brand-red
					foreground: '#ffffff' // white text on red
				},
				
				// Destructive = Error/Delete actions
				destructive: {
					DEFAULT: '#ef4444',  // red-500
					foreground: '#ffffff' // white text on red
				},
				
				// Muted = Subtle backgrounds and secondary text
				muted: {
					DEFAULT: '#f3f4f6',  // gray-100
					foreground: '#6b7280' // gray-500
				},
				
				// Accent = Highlights (using brand orange)
				accent: {
					DEFAULT: '#f97316',  // brand-orange
					foreground: '#ffffff' // white text on orange
				},
				
				// Popover = Dropdown/tooltip backgrounds
				popover: {
					DEFAULT: '#ffffff',  // white
					foreground: '#1f2937' // gray-800
				},
				
				// Card = Card backgrounds
				card: {
					DEFAULT: '#ffffff',  // white
					foreground: '#1f2937' // gray-800
				},
				
				// Sidebar = Navigation sidebar (uses brand gradient in practice)
				sidebar: {
					DEFAULT: '#f97316',  // brand-orange
					foreground: '#ffffff', // white
					primary: '#991b1b',  // brand-red
					'primary-foreground': '#ffffff', // white
					accent: '#fb923c',   // lighter orange
					'accent-foreground': '#ffffff', // white
					border: '#fb923c',   // lighter orange
					ring: '#ffffff'      // white
				},
				
			// AcciZard Brand Colors (your primary brand palette)
			'brand-red': {
				DEFAULT: '#991b1b', // red-800 - Main brand red
				700: '#b91c1c',     // red-700 - Lighter for hovers
				500: '#ef4444'      // red-500 - Bright red accent
			},
			'brand-orange': {
				DEFAULT: '#f97316', // orange-500 - Main brand orange
				400: '#fb923c'      // orange-400 - Lighter for hovers/active
			}

			
		},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
