/**
 * MVP migration: CSV exports from incumbent FSM tools (export-only — no API sync).
 * Used to seed column mappings before / alongside AI mapping in the import worker.
 */

export type ImportVendorPresetId = "jobber" | "housecall_pro" | "service_titan" | "generic";

export interface ImportVendorPreset {
  id: ImportVendorPresetId;
  label: string;
  /** CSV header (exact or case-insensitive) → Renvani customer import field */
  headerAliases: Record<string, string>;
}

const normalizeHeader = (header: string): string => header.trim().toLowerCase();

export const IMPORT_VENDOR_PRESETS: ImportVendorPreset[] = [
  {
    id: "jobber",
    label: "Jobber",
    headerAliases: {
      "first name": "firstName",
      "last name": "lastName",
      email: "email",
      phone: "phone",
      "mobile phone": "phone",
      "property name": "addressLine1",
      street: "addressLine1",
      city: "city",
      state: "state",
      zip: "zip",
      "postal code": "zip"
    }
  },
  {
    id: "housecall_pro",
    label: "Housecall Pro",
    headerAliases: {
      "customer first name": "firstName",
      "customer last name": "lastName",
      "customer email": "email",
      "customer phone": "phone",
      "service address": "addressLine1",
      city: "city",
      state: "state",
      zip: "zip"
    }
  },
  {
    id: "service_titan",
    label: "ServiceTitan",
    headerAliases: {
      name: "firstName",
      "customer name": "firstName",
      email: "email",
      phone: "phone",
      address: "addressLine1",
      city: "city",
      state: "state",
      zip: "zip"
    }
  },
  {
    id: "generic",
    label: "Generic CSV",
    headerAliases: {
      firstname: "firstName",
      "first name": "firstName",
      lastname: "lastName",
      "last name": "lastName",
      email: "email",
      phone: "phone",
      address: "addressLine1",
      city: "city",
      state: "state",
      zip: "zip"
    }
  }
];

export function inferImportVendorPresetFromHeaders(headers: string[]): ImportVendorPresetId | null {
  if (headers.length === 0) {
    return null;
  }

  const normalizedHeaders = new Set(headers.map(normalizeHeader));
  let best: { id: ImportVendorPresetId; score: number } | null = null;

  for (const preset of IMPORT_VENDOR_PRESETS) {
    if (preset.id === "generic") {
      continue;
    }

    const aliasKeys = Object.keys(preset.headerAliases).map(normalizeHeader);
    const score = aliasKeys.filter((key) => normalizedHeaders.has(key)).length;

    if (score >= 3 && (!best || score > best.score)) {
      best = { id: preset.id, score };
    }
  }

  return best?.id ?? null;
}

export function buildPresetColumnMapping(
  headers: string[],
  presetId: ImportVendorPresetId
): Record<string, string> {
  const preset = IMPORT_VENDOR_PRESETS.find((entry) => entry.id === presetId) ?? IMPORT_VENDOR_PRESETS.find((e) => e.id === "generic");
  if (!preset) {
    return {};
  }

  const mapping: Record<string, string> = {};

  for (const header of headers) {
    const field = preset.headerAliases[normalizeHeader(header)];
    if (field) {
      mapping[header] = field;
    }
  }

  return mapping;
}
