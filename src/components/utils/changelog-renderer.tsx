"use client";

import ReactMarkdown from "react-markdown";

type ChangelogRendererProps = {
  content: string;
  className?: string;
};

const isMarkdownContent = (content: string): boolean => {
  const markdownPatterns = [
    /`.*`/m, // Inline code
    /^#{1,6}\s/m, // Headers
    /\*.*\*/m, // Italic text
    /\[.*\]\(.*\)/m, // Links
    /^\*\s/m, // Unordered list
    /\*\*.*\*\*/m, // Bold text
    /^\d+\.\s/m, // Ordered list
    /```[\s\S]*```/m, // Code blocks
  ];

  return markdownPatterns.some((pattern) => pattern.test(content));
};

const ChangelogRenderer = ({ content, className }: ChangelogRendererProps) => {
  if (isMarkdownContent(content)) {
    return (
      <div className={className}>
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-base font-semibold mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-sm font-semibold mb-1">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-medium mb-1">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="leading-relaxed mb-1">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1 mb-2">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-1 mb-2">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-medium">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            code: ({ children }) => (
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                {children}
              </pre>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-muted-foreground pl-3 italic mb-2">
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className={className}>
      {content.split("\n").map((line, index) => (
        <p key={index} className="leading-relaxed">
          {line || "\u00A0"}
        </p>
      ))}
    </div>
  );
};

export default ChangelogRenderer;
