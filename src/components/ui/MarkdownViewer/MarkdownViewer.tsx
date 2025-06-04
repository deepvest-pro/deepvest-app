'use client';

import { CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownViewerProps {
  content: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Reusable component for rendering markdown content with syntax highlighting
 * Includes support for GitHub Flavored Markdown (tables, task lists, etc.)
 */
export function MarkdownViewer({ content, className = '', style }: MarkdownViewerProps) {
  return (
    <div
      className={`markdown-content ${className}`}
      style={{
        padding: '16px',
        backgroundColor: 'var(--gray-2)',
        borderRadius: '8px',
        ...style,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom components for better styling
          table: ({ children, ...props }) => (
            <div style={{ overflowX: 'auto' }}>
              <table {...props}>{children}</table>
            </div>
          ),
          // Ensure code blocks don't break layout
          pre: ({ children, ...props }) => (
            <pre {...props} style={{ overflowX: 'auto', ...props.style }}>
              {children}
            </pre>
          ),
          // Handle images responsively
          img: ({ src, alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              {...props}
              src={src}
              alt={alt}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '6px',
                margin: '1em 0',
                ...props.style,
              }}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
