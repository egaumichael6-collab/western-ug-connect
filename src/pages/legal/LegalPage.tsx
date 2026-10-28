import type { ReactNode } from "react";

export const LAST_UPDATED = "28 October 2026";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
      <div className="prose-legal mt-6">{children}</div>
      <p className="mt-10 rounded-xl bg-gold-50 p-4 text-xs text-gold-700">
        This document is a starting template written for WESTERN UG CONNECT. Have it reviewed by a Ugandan lawyer before launch,
        and add the operator's registered business name and physical address.
      </p>
    </div>
  );
}
