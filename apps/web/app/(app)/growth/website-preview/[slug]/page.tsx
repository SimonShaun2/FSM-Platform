import { notFound } from "next/navigation";

import { BrandedStorefront } from "@/src/components/growth/BrandedStorefront";
import { buildBrandedStorefrontViewModel } from "@/src/components/growth/branded-storefront.utils";
import { fetchPublicBookingSettingsBySlug } from "@/src/lib/public-booking-server";

/**
 * FS-58: staff-only preview of the branded storefront template (not customer-published).
 */
export default async function GrowthWebsitePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const settings = await fetchPublicBookingSettingsBySlug(slug).catch(() => null);

  if (!settings) {
    notFound();
  }

  const model = buildBrandedStorefrontViewModel(settings, {
    staffPreviewLine: "Staff preview — not published"
  });

  return (
    <BrandedStorefront
      model={model}
      previewBanner="Staff preview (FS-58) — not published to the public internet. Founder release required before go-live."
    />
  );
}
