"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const mdComponents: Partial<Components> = {
  p: ({ children }) => (
    <p className="mb-2 text-[13px] leading-relaxed text-gray-800 last:mb-0 dark:text-gray-100">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1.5 pl-5 text-[13px] text-gray-800 dark:text-gray-100">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1.5 pl-5 text-[13px] text-gray-800 dark:text-gray-100">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed marker:text-gray-500 dark:marker:text-gray-400 [&_p]:mb-1 [&_p]:last:mb-0">
      {children}
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900 dark:text-white">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-800 dark:text-gray-200">{children}</em>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-brand-600 underline decoration-brand-500/40 underline-offset-2 hover:text-brand-700 dark:text-brand-400"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-gray-200/90 px-1 py-0.5 font-mono text-[12px] text-gray-900 dark:bg-white/15 dark:text-gray-100"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-xl border border-gray-200/80 bg-gray-50 p-3 text-xs dark:border-white/10 dark:bg-black/35">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-brand-400 pl-3 text-[13px] italic text-gray-600 dark:border-brand-500 dark:text-gray-400">
      {children}
    </blockquote>
  ),
  h1: ({ children }) => (
    <h3 className="mb-2 mt-3 text-base font-semibold text-gray-900 first:mt-0 dark:text-white">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 mt-3 text-sm font-semibold text-gray-900 first:mt-0 dark:text-white">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-2 text-sm font-semibold text-gray-900 first:mt-0 dark:text-white">
      {children}
    </h3>
  ),
  hr: () => <hr className="my-3 border-gray-200 dark:border-white/10" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-[12px] text-gray-800 dark:text-gray-200">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-gray-200 bg-gray-50 px-2 py-1.5 font-semibold dark:border-white/15 dark:bg-white/5">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-200 px-2 py-1.5 dark:border-white/10">
      {children}
    </td>
  ),
};

export type AssistantMarkdownProps = {
  content: string;
  /** `markdown` (por defecto) o ausente: render MD. `plain`: texto sin formato. */
  format?: string;
};

function isMarkdownFormat(format?: string): boolean {
  if (format == null || format.trim() === "") return true;
  return format.toLowerCase() === "markdown";
}

export default function AssistantMarkdown({
  content,
  format,
}: AssistantMarkdownProps) {
  const raw = content ?? "";
  if (!isMarkdownFormat(format)) {
    return (
      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-800 dark:text-gray-100">
        {raw}
      </p>
    );
  }

  return (
    <div className="max-w-none [&>*:first-child]:mt-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {raw}
      </ReactMarkdown>
    </div>
  );
}
