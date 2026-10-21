import Link from "next/link";

import { BrandedPriceWidget } from "@/src/components/growth/BrandedPriceWidget";
import { BrandedStorefrontNav } from "@/src/components/growth/BrandedStorefrontNav";
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
  const showReviewsLink = model.reviewLinks.length > 0;

  return (
    <div className="min-h-screen bg-[#f7faf8] text-[#0f1530]">
      {previewBanner ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-950">
          {previewBanner}
        </div>
      ) : null}

      <header className="relative flex flex-wrap items-center gap-4 px-6 py-5 md:gap-7 md:px-16">
        <div className="flex flex-1 items-center gap-2.5">
          {model.logoUrl ? (
            <img src={model.logoUrl} alt="" className="size-8 rounded-[9px] object-cover" />
          ) : (
            <div className="size-8 rounded-[9px] bg-[#2f7d4f]" aria-hidden />
          )}
          <p className="text-xl font-semibold">{model.companyName}</p>
        </div>

        <BrandedStorefrontNav
          bookHref={bookHref}
          showReviewsLink={showReviewsLink}
          primaryClassName={PRIMARY}
        />

        <Link
          href={bookHref}
          className={`hidden h-11 items-center justify-center rounded-[10px] px-[18px] text-sm font-semibold text-white lg:inline-flex ${PRIMARY}`}
        >
          Book a clean
        </Link>
      </header>

      <section className="flex flex-col gap-10 px-6 py-10 md:flex-row md:items-center md:gap-12 md:px-16 md:py-14">
        <div className="max-w-[620px] flex-1">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-[#2f7d4f]">
            {model.trustLine ? model.trustLine : "Local service"}
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

      {showReviewsLink ? (
        <section id="reviews" className="px-6 pb-10 md:px-16" aria-labelledby="reviews-heading">
          <h2 id="reviews-heading" className="text-xl font-semibold text-[#0f1530]">
            Reviews
          </h2>
          <p className="mt-2 text-sm text-[#5e6684]">
            Read what customers have shared on these verified profiles.
          </p>
          <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
            {model.reviewLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] font-medium text-[#2f7d4f] underline-offset-2 hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
