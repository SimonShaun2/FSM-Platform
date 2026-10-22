import type { LocalBusinessJsonLd } from "@/src/components/growth/branded-storefront.utils";

interface BrandedLocalSeoProps {
  jsonLd: LocalBusinessJsonLd;
}

export function BrandedLocalSeo({ jsonLd }: BrandedLocalSeoProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
