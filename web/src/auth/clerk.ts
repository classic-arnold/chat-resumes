export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export const isClerkConfigured = Boolean(clerkPublishableKey)

export const clerkAppearance = {
	elements: {
		footer: 'clerk-footer-hidden',
		footerAction: 'clerk-footer-hidden',
		footerActionLink: 'clerk-footer-hidden',
		footerActionText: 'clerk-footer-hidden',
		footerPage: 'clerk-footer-hidden',
		footerPageLink: 'clerk-footer-hidden',
		footerPages: 'clerk-footer-hidden',
	},
} as const