import Link from "next/link";
import { Flame } from "lucide-react";
import { ReactNode } from "react";

/** Minimal public layout for Terms / Privacy (no auth, no app shell). */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-dark shadow-accent">
            <Flame size={20} className="text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-fg">FeliHealth</span>
        </Link>
        <Link href="/" className="text-sm font-semibold text-accent hover:underline">
          ← Back to app
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <article className="card prose-sm">
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">{title}</h1>
          <p className="mt-1 text-xs text-faint">Last updated: {updated}</p>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-strong [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-fg [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
            {children}
          </div>
        </article>
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-faint">
        <Link href="/terms" className="hover:text-fg">Terms</Link> ·{" "}
        <Link href="/privacy" className="hover:text-fg">Privacy</Link>
      </footer>
    </div>
  );
}

export const SUPPORT_CONTACT =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "the contact address shown on our website";
