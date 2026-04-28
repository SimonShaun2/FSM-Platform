import { z } from "zod";

import {
  buildCreateRouteSchema,
  buildDeleteRouteSchema,
  buildGetRouteSchema,
  buildListRouteSchema,
  buildUpdateRouteSchema
} from "../shared/schemas.js";

export const estimateSchemaStubs = {
  listQuery: z.object({}).strict(),
  createBody: z.object({}).strict(),
  idParams: z.object({ id: z.string().min(1) }),
  updateBody: z.object({}).strict()
};

export const listEstimatesSchema = buildListRouteSchema("estimates");
export const createEstimateSchema = buildCreateRouteSchema("estimates");
export const getEstimateSchema = buildGetRouteSchema("estimates");
export const updateEstimateSchema = buildUpdateRouteSchema("estimates");
export const deleteEstimateSchema = buildDeleteRouteSchema("estimates");
