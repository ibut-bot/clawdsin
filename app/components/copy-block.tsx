"use client";

import { useState } from "react";

export function CopyBlock({
  text,
  label,
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative rounded-lg border border-card-border bg-card">
      {label && (
        <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          {label}
        </p>
      )}
      <div className="flex items-start gap-2 p-4">
        <pre className="flex-1 overflow-x-auto text-xs text-zinc-300">
          <span className="select-none text-zinc-600">$ </span>
          {text}
        </pre>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-md border border-card-border bg-black/40 px-2 py-1 text-[11px] text-zinc-500 opacity-0 transition hover:border-zinc-500 hover:text-zinc-300 group-hover:opacity-100"
          title="Copy to clipboard"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function CopyCode({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative overflow-x-auto rounded-lg bg-black px-4 py-3">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md border border-card-border bg-card px-2 py-1 text-[11px] text-zinc-500 opacity-0 transition hover:border-zinc-500 hover:text-zinc-300 group-hover:opacity-100"
        title="Copy to clipboard"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="text-xs text-zinc-300">{children}</pre>
    </div>
  );
}
