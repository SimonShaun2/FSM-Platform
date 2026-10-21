"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface BrandedStorefrontNavProps {
  bookHref: string;
  showReviewsLink: boolean;
  primaryClassName: string;
}

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#pricing", label: "Pricing" },
  { href: "#areas", label: "Areas we serve" }
] as const;

export function BrandedStorefrontNav({ bookHref, showReviewsLink, primaryClassName }: BrandedStorefrontNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = showReviewsLink ? [...NAV_LINKS, { href: "#reviews", label: "Reviews" }] : [...NAV_LINKS];

  return (
    <>
      <nav className="hidden items-center gap-7 text-[15px] font-medium text-[#2a3360] lg:flex" aria-label="Primary">
        {links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-lg border border-[#e6dccb] bg-white text-[#2a3360] lg:hidden"
        aria-expanded={mobileOpen}
        aria-controls="branded-site-mobile-nav"
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
        {mobileOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>

      {mobileOpen ? (
        <nav
          id="branded-site-mobile-nav"
          className="absolute left-0 right-0 top-full z-20 border-b border-[#e6dccb] bg-[#f7faf8] px-6 py-4 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-3 text-[15px] font-medium text-[#2a3360]">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setMobileOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href={bookHref}
                className={`inline-flex h-11 w-full items-center justify-center rounded-[10px] text-sm font-semibold text-white ${primaryClassName}`}
                onClick={() => setMobileOpen(false)}
              >
                Book a clean
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </>
  );
}
