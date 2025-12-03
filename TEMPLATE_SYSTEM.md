# Template System Documentation

## Overview

The documentation system now uses a **modular, template-based architecture** that makes it easy to create different types of notes with consistent styling and behavior.

## Architecture

### Directory Structure

```
src/lib/templates/
├── processors/
│   ├── frontmatter-parser.js    # YAML parsing and type conversion
│   ├── image-processor.js        # Image handling and copying
│   └── content-processor.js      # Content transformation pipeline
├── GeneralNote.svelte            # Default template for markdown notes
├── TableBase.svelte              # Database/table view template
├── CoverBase.svelte              # Hero-style template with cover image
├── Image.svelte                  # Image component with wikilink support
├── Calendar.svelte               # Timeline/date display component
└── template-selector.js          # Template routing and selection logic
```

## Template Types

### 1. GeneralNote (Default)

Used for standard markdown notes.

**Auto-detection:**

- Regular `.md` or `.svx` files without special properties

**Features:**

- Optional cover image from frontmatter
- Prose styling for markdown content
- Automatic calendar display if dates present

**Example:**

```markdown
---
title: My Note
description: A standard note
created: 2024-01-15
image: cover.jpg
---

# Content here...
```

### 2. TableBase

Used for database views and data tables.

**Auto-detection:**

- `.base` files
- Notes with `views` property in frontmatter
- Notes with `filters` or `formulas` properties

**Features:**

- Integrates with `AutoDataTable` component
- Displays multiple views (cards, table, etc.)
- Handles filtering and sorting

**Example:**

```yaml
---
title: Albums Database
icon: database
views:
  - type: cards
    name: Gallery
    filters:
      and:
        - '!image.isEmpty()'
    image: image
  - type: table
    name: List
    order:
      - title
      - artist
      - year
---
```

### 3. CoverBase

Hero-style template with prominent cover image.

**Auto-detection:**

- Notes with `note_template: cover` in frontmatter
- Notes with `cover` property
- Notes with both `image` and `cover_style` properties

**Features:**

- 400px hero section with overlay
- Title/description on cover
- Metadata grid (auto-populates from frontmatter)
- Responsive design

**Example:**

```markdown
---
title: Featured Article
note_template: cover
image: hero.jpg
author: John Doe
category: Featured
created: 2024-01-15
---

# Content here...
```

## Custom Components

### `<Image>` Component

Renders images with wikilink support and base path resolution.

**Props:**

- `property`: Frontmatter property containing image path (default: "image")
- `src`: Direct image source (alternative to property)
- `alt`: Alt text
- `class`: CSS classes
- `style`: Inline styles
- `loading`: Loading strategy ("lazy" or "eager")

**Usage:**

```svelte
<!-- From frontmatter property -->
<Image property="cover" alt="Cover image" class="w-full rounded-lg" />

<!-- Direct source -->
<Image src="path/to/image.jpg" alt="My image" />

<!-- Wikilink format -->
<Image src="[[image.jpg]]" alt="Wikilinked image" />
```

### `<Calendar>` Component

Displays creation and modification dates in a timeline format.

**Features:**

- Reads dates from frontmatter (`created`, `modified`)
- Formatted display with relative times
- Card-based styling

**Usage:**

```svelte
<Calendar />
```

## Template Selection

### Explicit Selection

Use the `note_template` frontmatter field:

```markdown
---
title: My Note
note_template: cover
---
```

Values: `general`, `table`, or `cover`

### Automatic Detection

The system automatically selects templates based on:

1. **note_template field** (highest priority)
2. **File extension** (`.base` → table)
3. **Frontmatter properties:**
   - `views`, `filters`, `formulas` → table
   - `cover` or (`image` + `cover_style`) → cover
   - Everything else → general

## Processor Modules

### frontmatter-parser.js

**Functions:**

- `loadObsidianTypes()`: Load type definitions from `.obsidian/types.json`
- `convertToProperType()`: Smart type conversion (respects Obsidian types)
- `parseFrontmatter()`: Extract and parse YAML frontmatter
- `serializeFrontmatter()`: Convert frontmatter object back to YAML

### image-processor.js

**Functions:**

- `isImage()`: Check if file is an image
- `extractImageFilename()`: Extract filename from wikilink format
- `copyImages()`: Copy images from content to static directory
- `scanForImageReferences()`: Find all image references in content
- `processImageTokens()`: Replace `<Image>` tokens in content

### content-processor.js

**Functions:**

- `processTemplateTokens()`: Process `<Image>` and `<Calendar>` tokens
- `processContentWikilinks()`: Convert wikilinks to WikiLink components
- `processNoteContent()`: Full content transformation pipeline
- `determineNoteType()`: Auto-detect template type from properties

## Usage Examples

### Creating a Standard Note

```markdown
---
title: Standard Note
created: 2024-01-15
---

# My Note

Regular markdown content here.

<Calendar />
```

Result: Uses GeneralNote template with calendar display.

### Creating a Database View

```yaml
---
title: My Database
views:
  - type: table
    name: All Items
    order:
      - name
      - category
---
```

Result: Uses TableBase template with data table.

### Creating a Featured Article

```markdown
---
title: Featured Article
note_template: cover
image: hero.jpg
author: John Doe
category: Technology
tags: [featured, tutorial]
---

# Article content...

<Image property="image" alt="Hero image" />
```

Result: Uses CoverBase template with hero section and metadata grid.

## Route Generation

The system is integrated into `scripts/generate-routes.js`:

1. **Scans** content directory for `.md`, `.svx`, and `.base` files
2. **Parses** frontmatter and content
3. **Selects** appropriate template
4. **Processes** content (wikilinks, tokens, etc.)
5. **Generates** `+page.svx` files in routes directory

### Running Generation

```bash
node scripts/generate-routes.js
```

## Benefits

### Modularity

- Processors are separated into logical modules
- Easy to maintain and extend
- Clear separation of concerns

### Flexibility

- Choose templates explicitly or let system auto-detect
- Custom components can be used anywhere
- Easy to add new template types

### Consistency

- All notes use same template components
- Centralized styling and behavior
- Predictable structure

### Maintainability

- Linear, readable code flow
- Well-documented functions
- Easy to debug and test

## Adding New Templates

1. **Create template component** in `src/lib/templates/YourTemplate.svelte`
2. **Add to TEMPLATE_TYPES** in `template-selector.js`:
   ```javascript
   export const TEMPLATE_TYPES = {
   	// ... existing templates
   	yourtemplate: {
   		component: 'YourTemplate',
   		description: 'Your template description'
   	}
   };
   ```
3. **Update determineNoteType()** in `content-processor.js` if auto-detection is needed
4. **Regenerate routes**

## Migration Guide

### From Old System

Old system used inline route generation with hardcoded logic. New system:

- ✅ **Modular**: Processors separated by concern
- ✅ **Template-based**: Consistent UI components
- ✅ **Extensible**: Easy to add new features
- ✅ **Maintainable**: Linear, readable code

### Backward Compatibility

The system maintains backward compatibility:

- `.base` files still work (mapped to TableBase)
- Existing markdown files work (use GeneralNote)
- WikiLinks still processed
- Image copying still works

## Troubleshooting

### Images not displaying

- Check that images are in content directory
- Verify image references in frontmatter
- Run route generation to copy images to static

### Wrong template selected

- Use explicit `note_template` field
- Check frontmatter properties
- Review auto-detection logic in `determineNoteType()`

### Component not imported

- Verify `<Image>` or `<Calendar>` syntax in content
- Check generated `+page.svx` for imports
- Regenerate routes if needed

## Future Enhancements

Potential additions:

- **Timeline template**: For chronological content
- **Gallery template**: For image collections
- **Reference template**: For citations and links
- **Custom component API**: Register new components dynamically
- **Template inheritance**: Base templates with extensions
