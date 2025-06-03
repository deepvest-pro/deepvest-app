# UI Components

This directory contains reusable UI components that can be used throughout the application.

## MarkdownViewer

A component for rendering markdown content with syntax highlighting and GitHub Flavored Markdown support.

### Features

- ✅ GitHub Flavored Markdown (tables, task lists, strikethrough, etc.)
- ✅ Syntax highlighting for code blocks
- ✅ Responsive tables with horizontal scroll
- ✅ Responsive images
- ✅ Customizable styling
- ✅ Proper overflow handling for code blocks

### Usage

```tsx
import { MarkdownViewer } from '@/components/ui';

function MyComponent() {
  const markdownContent = `
# Hello World

This is **bold** and *italic* text.

## Code Example

\`\`\`typescript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

## Table

| Name | Age | City |
|------|-----|------|
| John | 25  | NYC  |
| Jane | 30  | LA   |
  `;

  return (
    <MarkdownViewer
      content={markdownContent}
      className="custom-class"
      style={{ maxHeight: '400px', overflow: 'auto' }}
    />
  );
}
```

### Props

| Prop        | Type                  | Default | Description                                  |
| ----------- | --------------------- | ------- | -------------------------------------------- |
| `content`   | `string`              | -       | **Required.** The markdown content to render |
| `className` | `string`              | `''`    | Additional CSS classes to apply              |
| `style`     | `React.CSSProperties` | `{}`    | Additional inline styles                     |

### Styling

The component uses the `.markdown-content` CSS class for styling. All markdown styles are defined in `src/styles/global/globals.css`.

### Dependencies

- `react-markdown` - Core markdown rendering
- `remark-gfm` - GitHub Flavored Markdown support
- `rehype-highlight` - Syntax highlighting for code blocks
- `highlight.js` - Syntax highlighting engine (styles imported in globals.css)
