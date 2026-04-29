import type { ReactNode } from "react";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageLayout({ title, subtitle, actions, children }: PageLayoutProps) {
  return (
    <div className="space-y-6">
      <section className="flex min-h-16 flex-col justify-between gap-4 rounded-[28px] border border-neutral-200 bg-white px-6 py-5 shadow-sm md:flex-row md:items-center">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-neutral-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
      </section>
      <div>{children}</div>
    </div>
  );
}
