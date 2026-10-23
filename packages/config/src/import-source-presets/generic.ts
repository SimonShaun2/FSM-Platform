import type { ImportSourcePreset } from "./types.js";

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
