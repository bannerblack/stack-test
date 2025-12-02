# Onyxia

## How It Works

- This is a documentation site template built with Sveltekit and Shadcn-Svelte components for a snappy, clean look and feel.
- Markdown (.md) notes are copied from the /src/content folder and are converted into routes and treated depending on their properties.
- The sidebar navigation is auto-generated based on the notes in the /src/content folder and their properties.
- Notes can be organized into categories, pinned for easy access, or treated as standalone pages

### The Tech

- _Sveltekit_ : JavaScript framework for building fast web applications.
  - Sveltekit is rendered to a static site using the static adapter, meaning you can run a fully functional documentation site without a server.
- _Shadcn-Svelte_ : Shadcn UI components ported for Svelte. This is a component library with a slick, professional feeling that is a great starting point.
- _MDsveX_ : Markdown preprocessor for Svelte.

## Note Properties and their Behaviors

Use [Obsidian properties](https://help.obsidian.md/properties) to customize notes with icons, titles, pages, and categories.

- `title`: (text) The title of the note, shown in the sidebar and at the top of the note. (Overrides the default note name)
- `category`: (text) Used to group notes in the sidebar. Notes with the same category will be grouped together.
- `icon`: (text: specific icon name) The icon to display next to the note title in the sidebar. This should correspond to an icon name from the [Lucide Svelte icon set](https://lucide.dev/icons/). EXAMPLE: `rocket`, `code`, `folder`, etc.
- `pin`: (true or false) If set to "true", the note will appear in the "Pinned" section of the sidebar for easy access.
- `page`: (true or false) If set to "true", the note will be treated as a standalone page and will appear in the lower section of the sidebar. Good for help or about sections.

## Where to Find Things

### "I want to edit the way the UI looks"

- `src/lib/components/` contains the Shadcn-Svelte components used throughout the app. You can customize these components or create new ones as needed.
- **_Note_**: If you edit the Shadcn-Svelte components directly, this will change how they look everywhere in the app. If you only want to change how it looks in one place, you can use tailwindcss and add classes to the elements to override the styles.
- [ShadCN-Svelte Documation](https://www.shadcn-svelte.com/)
