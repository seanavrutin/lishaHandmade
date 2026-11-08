import type { ReactNode } from 'react';

/** A settings card that opens and closes by tapping its title; starts closed. */
export default function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl bg-surface/80 shadow-sm ring-1 ring-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold [&::-webkit-details-marker]:hidden">
        <h2>{title}</h2>
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="space-y-3 px-4 pb-4">{children}</div>
    </details>
  );
}
