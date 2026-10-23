import type { ImportSourcePreset } from "./types.js";

export const JOBBER_PRESETS: ImportSourcePreset[] = [
  {
    id: "jobber",
    entity: "customers",
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
    id: "jobber_price_book",
    entity: "products",
    label: "Jobber (products & services)",
    headerAliases: {
      name: "name",
      "product / service name": "name",
      description: "description",
      "unit price": "unitPrice",
      price: "unitPrice",
      category: "type"
    }
  }
];
