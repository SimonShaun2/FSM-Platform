import { z } from "zod";

import {
  buildCreateRouteSchema,
  buildDeleteRouteSchema,
  buildGetRouteSchema,
  buildListRouteSchema,
  buildUpdateRouteSchema
} from "../shared/schemas.js";

export const assetSchemaStubs = {
  listQuery: z.object({}).strict(),
  createBody: z.object({}).strict(),
  idParams: z.object({ id: z.string().min(1) }),
  updateBody: z.object({}).strict()
};

export const listAssetsSchema = buildListRouteSchema("assets");
export const createAssetSchema = buildCreateRouteSchema("assets");
export const getAssetSchema = buildGetRouteSchema("assets");
export const updateAssetSchema = buildUpdateRouteSchema("assets");
export const deleteAssetSchema = buildDeleteRouteSchema("assets");
