import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-heading text-sm font-semibold text-primary-foreground">
          iP
        </span>
        <span className="font-heading text-base font-semibold tracking-tight text-foreground">
          iPractice
        </span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-md">{children}</div>
    </div>
  );
}
