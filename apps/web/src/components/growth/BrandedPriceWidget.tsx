"use client";

import Link from "next/link";

import { buildBookPath } from "@/src/components/growth/branded-storefront.utils";

interface BrandedPriceWidgetProps {
  bookingSlug: string;
  primaryClassName: string;
}

export function BrandedPriceWidget({ bookingSlug, primaryClassName }: BrandedPriceWidgetProps) {
  const bookHref = buildBookPath(bookingSlug);

  return (
    <div className="w-full max-w-[460px] rounded-[14px] border border-[#e6dccb] bg-white p-7">
      <h2 className="text-[22px] font-semibold text-[#0f1530]">Get your price</h2>
      <p className="mt-2 text-sm text-[#5e6684]">
        Continue to our secure booking flow for live availability and verified pricing.
      </p>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="text-[13px] font-medium text-[#2a3360]">Type of clean</span>
          <div className="mt-1.5 flex h-12 items-center rounded-lg border border-[#e6dccb] px-3.5 text-[15px] text-[#0f1530]">
            Recurring · every 2 weeks
          </div>
        </label>
        <label className="block">
          <span className="text-[13px] font-medium text-[#2a3360]">Home</span>
          <div className="mt-1.5 flex h-12 items-center rounded-lg border border-[#e6dccb] px-3.5 text-[15px] text-[#0f1530]">
            3 bed · 2 bath · pets
          </div>
        </label>
        <label className="block">
          <span className="text-[13px] font-medium text-[#2a3360]">ZIP</span>
          <div className="mt-1.5 flex h-12 items-center rounded-lg border border-[#e6dccb] px-3.5 text-[15px] text-[#0f1530]">
            Enter in booking flow
          </div>
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[10px] bg-[#e4f1e8] p-3.5 text-[#2f7d4f]">
        <p className="text-[22px] font-semibold">Price at checkout</p>
        <p className="text-[13px] font-medium">Verified in Renvani</p>
      </div>

      <Link
        href={bookHref}
        className={`mt-4 flex h-[52px] w-full items-center justify-center rounded-[10px] text-sm font-semibold text-white ${primaryClassName}`}
      >
        Book this time
      </Link>
    </div>
  );
}
