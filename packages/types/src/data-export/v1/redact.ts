import {
  DATA_EXPORT_MANIFEST_V1,
  type DataExportEntityName
} from "./manifest.js";

function omitKeys<T extends Record<string, unknown>>(row: T, keys: string[]): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...row };
  for (const key of keys) {
    delete copy[key];
  }
  return copy;
}

export function redactExportRows(
  entity: DataExportEntityName,
  rows: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  const excluded = DATA_EXPORT_MANIFEST_V1.entities[entity].excludedFields;
  return rows.map((row) => omitKeys(row, excluded));
}
