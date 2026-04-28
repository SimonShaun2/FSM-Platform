import type { FastifyPluginAsync } from "fastify";

import publicEstimateRoutes from "./estimates/index.js";

const publicRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(publicEstimateRoutes, { prefix: "/estimates" });
};

export default publicRoutes;
