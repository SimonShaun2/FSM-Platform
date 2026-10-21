import Link from "next/link";

import { BrandedPriceWidget } from "@/src/components/growth/BrandedPriceWidget";
import {
  buildBookPath,
  type BrandedStorefrontViewModel
} from "@/src/components/growth/branded-storefront.utils";

interface BrandedStorefrontProps {
  model: BrandedStorefrontViewModel;
  previewBanner?: string | null;
}

const PRIMARY = "bg-[#2f7d4f] hover:bg-[#286b44]";

export function BrandedStorefront({ model, previewBanner }: BrandedStorefrontProps) {
  const bookHref = buildBookPath(model.bookingSlug);

  return (
    <div className="min-h-screen bg-[#f7faf8] text-[#0f1530]">
      {previewBanner ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-950">
          {previewBanner}
        </div>
      ) : null}

      <header className="flex flex-wrap items-center gap-4 px-6 py-5 md:gap-7 md:px-16">
        <div className="flex items-center gap-2.5">
          {model.logoUrl ? (
            <img src={model.logoUrl} alt="" className="size-8 rounded-[9px] object-cover" />
          ) : (
            <div className="size-8 rounded-[9px] bg-[#2f7d4f]" aria-hidden />
          )}
          <p className="text-xl font-semibold">{model.companyName}</p>
        </div>
        <div className="hidden flex-1 md:block" />
        <nav className="hidden items-center gap-7 text-[15px] font-medium text-[#2a3360] lg:flex" aria-label="Primary">
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <a href="#areas">Areas we serve</a>
          <a href="#reviews">Reviews</a>
        </nav>
        <Link
          href={bookHref}
          className={`inline-flex h-11 items-center justify-center rounded-[10px] px-[18px] text-sm font-semibold text-white ${PRIMARY}`}
        >
          Book a clean
        </Link>
      </header>

      <section className="flex flex-col gap-10 px-6 py-10 md:flex-row md:items-center md:gap-12 md:px-16 md:py-14">
        <div className="max-w-[620px] flex-1">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-[#2f7d4f]">
            Local service · {model.trustLine}
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-[56px] md:leading-[62px]">
            A spotless home, on your schedule.
          </h1>
          <p className="mt-5 max-w-[560px] text-lg leading-7 text-[#2a3360]">{model.tagline}</p>
          <ul className="mt-5 flex flex-wrap gap-3" aria-label="Trust badges">
            {["Insured & background-checked", "Same crew every visit", "Pause anytime"].map((badge) => (
              <li
                key={badge}
                className="rounded-md bg-[#e4f1e8] px-2 py-0.5 text-[11px] font-medium text-[#2f7d4f]"
              >
                {badge}
              </li>
            ))}
          </ul>
        </div>
        <div id="pricing" className="flex w-full justify-center md:justify-end">
          <BrandedPriceWidget bookingSlug={model.bookingSlug} primaryClassName={PRIMARY} />
        </div>
      </section>

      <section id="services" className="grid gap-4 px-6 pb-4 md:grid-cols-2 md:px-16 lg:grid-cols-4">
        {model.serviceCards.map((card) => (
          <article
            key={card.id}
            className="rounded-[14px] border border-[#e6dccb] bg-white p-5"
          >
            <h3 className="text-[17px] font-semibold">{card.title}</h3>
            <p className="mt-1.5 text-sm text-[#5e6684]">{card.subtitle}</p>
          </article>
        ))}
      </section>

      <section id="areas" className="px-6 py-8 md:px-16">
        <p className="text-sm text-[#5e6684]">
          Service area and live slot availability are confirmed in the booking flow — we never show unverified
          appointments.
        </p>
      </section>

      <section id="reviews" className="sr-only" aria-hidden>
        Reviews
      </section>

      <footer className="flex flex-col gap-2 px-6 py-7 text-[13px] text-[#5e6684] md:flex-row md:items-center md:justify-between md:px-16">
        <p>
          © {model.companyName}
          {model.phone ? ` · ${model.phone}` : ""}
        </p>
        <p className="font-mono text-[11px] tracking-wide">Powered by Renvani</p>
      </footer>
    </div>
  );
}
