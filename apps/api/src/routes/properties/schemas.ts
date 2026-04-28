import { z } from "zod";

import {
  buildCreateRouteSchema,
  buildDeleteRouteSchema,
  buildGetRouteSchema,
  buildListRouteSchema,
  buildUpdateRouteSchema
} from "../shared/schemas.js";

export const propertySchemaStubs = {
  listQuery: z.object({}).strict(),
  createBody: z.object({}).strict(),
  idParams: z.object({ id: z.string().min(1) }),
  updateBody: z.object({}).strict()
};

export const listPropertiesSchema = buildListRouteSchema("properties");
export const createPropertySchema = buildCreateRouteSchema("properties");
export const getPropertySchema = buildGetRouteSchema("properties");
export const updatePropertySchema = buildUpdateRouteSchema("properties");
export const deletePropertySchema = buildDeleteRouteSchema("properties");
