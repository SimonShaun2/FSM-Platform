import type { ImportSourcePreset } from "./types.js";

export const GENERIC_NOTES_PRESET: ImportSourcePreset = {
  id: "generic",
  entity: "notes",
  label: "Generic notes CSV",
  headerAliases: {
    "note id": "sourceId",
    id: "sourceId",
    "customer id": "customerSourceId",
    "client id": "customerSourceId",
    "job id": "jobSourceId",
    "work order id": "jobSourceId",
    note: "content",
    body: "content",
    text: "content",
    visibility: "visibility",
    type: "visibility",
    internal: "isInternal",
    "created at": "notedAt",
    created: "notedAt",
    date: "notedAt"
  }
};

export const GENERIC_CUSTOMER_PRESET: ImportSourcePreset = {
  id: "generic",
  entity: "customers",
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
};
