import type { PublicBookingSettingsRecord } from "@/src/hooks/booking.hooks";

export interface BrandedServiceCard {
  id: string;
  title: string;
  subtitle: string;
}

export interface BrandedStorefrontViewModel {
  companyName: string;
  bookingSlug: string;
  tagline: string;
  phone: string | null;
  logoUrl: string | null;
  serviceCards: BrandedServiceCard[];
  trustLine: string;
}

const CLEANING_FALLBACK_CARDS: BrandedServiceCard[] = [
  { id: "standard", title: "Standard clean", subtitle: "from $129" },
  { id: "deep", title: "Deep clean", subtitle: "from $219" },
  { id: "move", title: "Move-in / move-out", subtitle: "from $289" },
  { id: "recurring", title: "Recurring", subtitle: "save 10%" }
];

function readServiceLabel(service: Record<string, unknown>): string | null {
  if (typeof service.label === "string" && service.label.trim()) {
    return service.label.trim();
  }

  if (typeof service.name === "string" && service.name.trim()) {
    return service.name.trim();
  }

  if (typeof service.category === "string" && service.category.trim()) {
    return service.category.trim();
  }

  return null;
}

function readServiceSubtitle(service: Record<string, unknown>): string {
  if (typeof service.priceHint === "string" && service.priceHint.trim()) {
    return service.priceHint.trim();
  }

  if (typeof service.subtitle === "string" && service.subtitle.trim()) {
    return service.subtitle.trim();
  }

  const types = Array.isArray(service.types)
    ? service.types.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];

  if (types.length > 0) {
    return types.slice(0, 2).join(" · ");
  }

  return "Request a quote";
}

export function buildServiceCards(offeredServices: Array<Record<string, unknown>>): BrandedServiceCard[] {
  const cards: BrandedServiceCard[] = [];

  for (const service of offeredServices) {
    const title = readServiceLabel(service);

    if (!title) {
      continue;
    }

    cards.push({
      id: title.toLowerCase().replace(/\s+/g, "-"),
      title,
      subtitle: readServiceSubtitle(service)
    });
  }

  if (cards.length === 0) {
    return CLEANING_FALLBACK_CARDS;
  }

  return cards.slice(0, 4);
}

export function buildBrandedStorefrontViewModel(
  settings: PublicBookingSettingsRecord,
  options?: { trustLineOverride?: string }
): BrandedStorefrontViewModel {
  const companyName = settings.companyName.trim() || "Your cleaning team";
  const tagline =
    settings.tagline?.trim() ||
    "Instant prices, real crew availability, and booking in under a minute. Same trusted crew every visit.";

  return {
    companyName,
    bookingSlug: settings.bookingSlug || settings.companySlug,
    tagline,
    phone: settings.phone ?? null,
    logoUrl: settings.logoUrl ?? null,
    serviceCards: buildServiceCards(settings.offeredServices),
    trustLine: options?.trustLineOverride ?? "4.9 ★ from verified reviews"
  };
}

export function buildBookPath(slug: string, source = "website"): string {
  const query = new URLSearchParams({ src: source });
  return `/book/${encodeURIComponent(slug)}?${query.toString()}`;
}
