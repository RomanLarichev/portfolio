// src/features/prompts/components/MarkdownPreview.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
}

export const MarkdownPreview: React.FC<Props> = ({ content }) => {
  if (!content.trim()) {
    return (
      <div style={{ padding: 16, color: '#999', fontStyle: 'italic' }}>
        Пусто. Начните печатать слева.
      </div>
    );
  }

  return (
    <div
      className="markdown-preview"
      style={{
        padding: '12px 16px',
        fontSize: 14,
        lineHeight: 1.7,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflow: 'auto',
        height: '100%',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '16px 0 8px', borderBottom: '1px solid #eee', paddingBottom: 4 }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '14px 0 6px', color: '#1677ff' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '12px 0 4px' }}>{children}</h3>
          ),
          p: ({ children }) => <p style={{ margin: '8px 0' }}>{children}</p>,
          ul: ({ children }) => <ul style={{ paddingLeft: 24, margin: '8px 0' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: 24, margin: '8px 0' }}>{children}</ol>,
          li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
          code: ({ inline, children, className }) => {
            const isBlock = !inline;
            return isBlock ? (
              <pre style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 6, overflow: 'auto', fontSize: 13 }}>
                <code>{children}</code>
              </pre>
            ) : (
              <code style={{ backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: 3, fontSize: 13 }}>
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: '4px solid #1677ff', paddingLeft: 12, margin: '8px 0', color: '#666' }}>
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <table style={{ borderCollapse: 'collapse', width: '100%', margin: '12px 0' }}>{children}</table>
          ),
          th: ({ children }) => (
            <th style={{ border: '1px solid #ddd', padding: '6px 10px', backgroundColor: '#fafafa', textAlign: 'left' }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{ border: '1px solid #ddd', padding: '6px 10px' }}>{children}</td>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#1677ff' }}>
              {children}
            </a>
          ),
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return <input type="checkbox" checked={checked} readOnly style={{ marginRight: 6 }} />;
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};