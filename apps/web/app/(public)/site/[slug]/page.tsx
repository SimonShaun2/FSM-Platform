import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrandedStorefront } from "@/src/components/growth/BrandedStorefront";
import { buildBrandedStorefrontViewModel } from "@/src/components/growth/branded-storefront.utils";
import { fetchPublicBookingSettingsBySlug } from "@/src/lib/public-booking-server";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const settings = await fetchPublicBookingSettingsBySlug(slug).catch(() => null);

  if (!settings) {
    return { title: "Business not found" };
  }

  return {
    title: `${settings.companyName} · Book cleaning online`,
    description:
      settings.tagline ??
      `Book ${settings.companyName} online. Verified availability and pricing through Renvani.`
  };
}

export default async function BrandedWebsitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const settings = await fetchPublicBookingSettingsBySlug(slug).catch(() => null);

  if (!settings) {
    notFound();
  }

  const model = buildBrandedStorefrontViewModel(settings);

  return <BrandedStorefront model={model} />;
}
