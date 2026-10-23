import { IMPORT_SOURCE_PRESETS } from "./catalog.js";
import { normalizeHeader } from "./normalize.js";
import type { ImportSourcePresetId } from "./types.js";

export function buildPresetColumnMapping(
  headers: string[],
  presetId: ImportSourcePresetId
): Record<string, string> {
  const preset =
    IMPORT_SOURCE_PRESETS.find((entry) => entry.id === presetId) ??
    IMPORT_SOURCE_PRESETS.find((entry) => entry.id === "generic");

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
