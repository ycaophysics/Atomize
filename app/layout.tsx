import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atomize",
  description: "Task breakdown and Now Card for Stage 0"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Atomize</h1>
              <p className="text-sm text-slate-400">
                Stage 0: Task inventory, breakdown, and Now Card
              </p>
            </div>
            <nav className="flex gap-4 text-sm">
              <a href="/">Now</a>
              <a href="/tasks">Tasks</a>
              <a href="/settings">Settings</a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
