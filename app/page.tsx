import Link from "next/link";
import {
  IconBriefcase,
  IconFileText,
  IconSparkles,
  IconUsers,
} from "@/components/icons";

const features = [
  {
    title: "Organize clients",
    description: "Keep customer details and job history together.",
    icon: IconUsers,
  },
  {
    title: "Manage work orders",
    description: "Track jobs, dates, budgets, photos, and documents.",
    icon: IconBriefcase,
  },
  {
    title: "Create estimates & invoices",
    description: "Build estimates, issue invoices, and track outstanding balances.",
    icon: IconFileText,
  },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.38),transparent_48%),radial-gradient(circle_at_top_left,rgba(14,165,233,0.2),transparent_42%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="Quotiq AI home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold shadow-lg shadow-blue-950/40">Q</span>
            <span className="text-lg font-semibold tracking-tight">Quotiq AI</span>
          </Link>
          <Link href="/sign-in" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10">
            Sign in
          </Link>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-400/10 px-3 py-1.5 text-sm font-semibold text-blue-200">
              <IconSparkles className="h-4 w-4" />
              Built for contractors
            </div>
            <h1 className="mt-7 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Run your service business from one workspace.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Quotiq AI brings clients, work orders, estimates, invoices, and job records together so contractors can stay organized and get paid faster.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500">
                Create account
              </Link>
              <Link href="/sign-in" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {features.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
                <Icon className="h-6 w-6 text-blue-300" />
                <h2 className="mt-4 font-semibold">{title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 py-5 text-sm text-slate-500">
          Quotiq AI · Contractor estimating, work orders, and invoicing.
        </footer>
      </div>
    </main>
  );
}
