export const emptyObjectJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {}
} as const;

export const idParamsJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id"],
  properties: {
    id: {
      type: "string"
    }
  }
} as const;

export const notImplementedResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["error", "message", "requestId"],
  properties: {
    error: {
      type: "string"
    },
    message: {
      type: "string"
    },
    requestId: {
      type: "string"
    }
  }
} as const;

export function buildListRouteSchema(tag: string) {
  return {
    tags: [tag],
    querystring: emptyObjectJsonSchema,
    response: {
      501: notImplementedResponseSchema
    }
  } as const;
}

export function buildCreateRouteSchema(tag: string) {
  return {
    tags: [tag],
    body: emptyObjectJsonSchema,
    response: {
      501: notImplementedResponseSchema
    }
  } as const;
}

export function buildGetRouteSchema(tag: string) {
  return {
    tags: [tag],
    params: idParamsJsonSchema,
    response: {
      501: notImplementedResponseSchema
    }
  } as const;
}

export function buildUpdateRouteSchema(tag: string) {
  return {
    tags: [tag],
    params: idParamsJsonSchema,
    body: emptyObjectJsonSchema,
    response: {
      501: notImplementedResponseSchema
    }
  } as const;
}

export function buildDeleteRouteSchema(tag: string) {
  return {
    tags: [tag],
    params: idParamsJsonSchema,
    response: {
      501: notImplementedResponseSchema
    }
  } as const;
}
