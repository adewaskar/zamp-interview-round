"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MarkdownBody } from "./Markdown.styles";

/**
 * Renders assistant text as GitHub-flavored markdown; links open in a new tab
 * with safe `rel`.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <MarkdownBody>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: linkChildren }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {linkChildren}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </MarkdownBody>
  );
}
