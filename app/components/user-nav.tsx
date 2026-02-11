"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

export function UserNav() {
  const { data: session } = useSession();

  if (session) {
    return (
      <Link
        href="/my-agents"
        className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
      >
        My Agents
      </Link>
    );
  }

  return (
    <button
      onClick={() => signIn("twitter")}
      className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Sign in
    </button>
  );
}
