<script>
	import { config } from '$lib/../docs.config.js';
	import SunMoon from '@lucide/svelte/icons/sun-moon';
	import { Button } from '$lib/components/ui/button/index.js';
	import { onMount } from 'svelte';

	let themes = $state(['light']);
	let currentThemeIndex = $state(0);
	let mounted = $state(false);

	const currentTheme = $derived(themes[currentThemeIndex]);

	onMount(() => {
		// Parse themes from stylesheets by looking for theme classes
		const detectedThemes = ['light']; // 'light' represents :root

		for (const sheet of document.styleSheets) {
			try {
				for (const rule of sheet.cssRules) {
					if (rule instanceof CSSStyleRule) {
						// Match selectors like .dark, .sepia, .ocean etc. that define --background
						const match = rule.selectorText.match(/^\.([a-z][a-z0-9-]*)$/i);
						if (match && rule.style.getPropertyValue('--background')) {
							const themeName = match[1];
							if (!detectedThemes.includes(themeName)) {
								detectedThemes.push(themeName);
							}
						}
					}
				}
			} catch (e) {
				// Skip cross-origin stylesheets
			}
		}

		themes = detectedThemes;

		// Check localStorage for saved theme, fallback to config default
		const savedTheme = localStorage.getItem('theme') || config.defaultTheme || 'light';
		const index = themes.findIndex((t) => t === savedTheme);
		if (index !== -1) {
			currentThemeIndex = index;
			applyTheme(themes[index]);
		}

		mounted = true;
	});

	function applyTheme(themeName) {
		// Remove all theme classes from html element
		themes.forEach((t) => {
			if (t !== 'light') {
				document.documentElement.classList.remove(t);
			}
		});

		// Add the new theme class (skip for 'light' as it's the default :root)
		if (themeName !== 'light') {
			document.documentElement.classList.add(themeName);
		}

		// Save to localStorage
		localStorage.setItem('theme', themeName);
	}

	function cycleTheme() {
		currentThemeIndex = (currentThemeIndex + 1) % themes.length;
		applyTheme(themes[currentThemeIndex]);
	}
</script>

<Button onclick={cycleTheme} size="icon-sm"><SunMoon class="size-4" /></Button>
