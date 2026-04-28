import type { FastifyReply, FastifyRequest } from "fastify";

import { getCompany, updateCompany } from "../../services/company.service.js";
import type { UpdateCompanyInput } from "./schemas.js";

function toCompanyResponse(company: {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  timezone: string;
  logoUrl: string | null;
  createdAt: Date;
}) {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    phone: company.phone,
    email: company.email,
    website: company.website,
    addressLine1: company.addressLine1,
    addressLine2: company.addressLine2,
    city: company.city,
    state: company.state,
    zip: company.zip,
    timezone: company.timezone,
    logoUrl: company.logoUrl,
    createdAt: company.createdAt.toISOString()
  };
}

export async function getCompanyHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const company = await getCompany(request.company.id);

  return reply.send({
    company: toCompanyResponse(company)
  });
}

export async function updateCompanyHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const company = await updateCompany(request.company.id, request.user.id, request.body as UpdateCompanyInput);

  return reply.send({
    company: toCompanyResponse(company)
  });
}
