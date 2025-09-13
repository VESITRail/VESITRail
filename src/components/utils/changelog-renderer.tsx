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

const renderLineWithLinks = (line: string) => {
  const urlRegex = /(https?:\/\/[^\s\[\]()]+)/g;
  const parts = line.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--selection-color)",
            backgroundColor: "var(--selection-background)",
          }}
          className="hover:underline break-all bg-accent/20 px-1 py-0.5 rounded-sm"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const ChangelogRenderer = ({ content, className }: ChangelogRendererProps) => {
  const cleanContent = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const contentWithLinks = cleanContent;

  if (isMarkdownContent(cleanContent)) {
    return (
      <div className={className}>
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-base font-semibold mb-2 text-foreground">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-sm font-semibold mb-1 text-foreground">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-medium mb-1 text-foreground">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="leading-relaxed mb-1 text-foreground">{children}</p>
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
              <li className="leading-relaxed text-foreground">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-medium text-foreground">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-muted-foreground">{children}</em>
            ),
            code: ({ children }) => (
              <code className="bg-muted text-muted-foreground px-1 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-muted text-muted-foreground p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                {children}
              </pre>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--selection-color)",
                  backgroundColor: "var(--selection-background)",
                }}
                className="hover:underline break-all bg-accent/20 px-1 py-0.5 rounded-sm"
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-muted-foreground pl-3 italic mb-2 text-muted-foreground">
                {children}
              </blockquote>
            ),
          }}
        >
          {contentWithLinks}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className={className}>
      {cleanContent.split("\n").map((line, index) => (
        <p key={index} className="leading-relaxed text-foreground">
          {line ? renderLineWithLinks(line) : "\u00A0"}
        </p>
      ))}
    </div>
  );
};

export default ChangelogRenderer;
