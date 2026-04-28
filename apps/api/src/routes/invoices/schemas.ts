import { z } from "zod";

import {
  buildCreateRouteSchema,
  buildDeleteRouteSchema,
  buildGetRouteSchema,
  buildListRouteSchema,
  buildUpdateRouteSchema
} from "../shared/schemas.js";

export const invoiceSchemaStubs = {
  listQuery: z.object({}).strict(),
  createBody: z.object({}).strict(),
  idParams: z.object({ id: z.string().min(1) }),
  updateBody: z.object({}).strict()
};

export const listInvoicesSchema = buildListRouteSchema("invoices");
export const createInvoiceSchema = buildCreateRouteSchema("invoices");
export const getInvoiceSchema = buildGetRouteSchema("invoices");
export const updateInvoiceSchema = buildUpdateRouteSchema("invoices");
export const deleteInvoiceSchema = buildDeleteRouteSchema("invoices");
