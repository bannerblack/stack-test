// Documentation Site Configuration
// This file contains user-configurable settings for your documentation site

export const config = {
	// Site information displayed in the sidebar header
	site: {
		name: 'Stack Documentation',
		description: 'No Gods No Masters',
		logo: 'book-open', // Icon name from Lucide icons (kebab-case)
		baseUrl: '' // Base URL for absolute links when needed (e.g., '/repo-name' for GitHub Pages)
	},

	// Theme configuration
	// Themes are auto-detected from layout.css (classes like .dark, .sepia, etc.)
	// Set the default theme here (use 'light' for :root styles)
	defaultTheme: 'dark',

	// Sidebar configuration
	sidebar: {
		defaultWidth: 300, // Default width in pixels
		minWidth: 200, // Minimum width when resizing
		maxWidth: 500, // Maximum width when resizing
		collapsedWidth: 48 // Width when collapsed (icon-only mode)
	},

	// User profile for the sidebar footer (optional)
	user: {
		name: 'Black Banner',
		email: 'brook@banner.black',
		avatar: null // Set to a path like '/avatars/user.jpg' if you have one
	},

	// Path configuration
	paths: {
		useRelative: true, // Prefer relative paths over absolute
		forceAbsolute: false // Force absolute paths even when relative would work
	},
};
