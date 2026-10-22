import { z } from "zod";

import { CreateDataExportBodySchema, DataExportSessionIdParamsSchema } from "@fsm/types";

import { withZodValidation } from "../shared/validation.js";

export const createDataExportValidation = withZodValidation({
  body: CreateDataExportBodySchema
});

export const dataExportSessionIdValidation = withZodValidation({
  params: DataExportSessionIdParamsSchema
});

const listDataExportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional()
});

export const listDataExportsValidation = withZodValidation({
  query: listDataExportsQuerySchema
});

export const getManifestRouteSchema = {};
export const createDataExportRouteSchema = {};
export const listDataExportsRouteSchema = {};
export const getDataExportRouteSchema = {};
export const downloadDataExportRouteSchema = {};
export const retryDataExportRouteSchema = {};
