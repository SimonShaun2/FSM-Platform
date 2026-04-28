import { AppError, ErrorCode } from "@fsm/types";

export interface CreateEstimateInput extends Record<string, never> {}
export interface UpdateEstimateInput extends Record<string, never> {}

export async function listEstimates(_companyId: string): Promise<never> {
  throw new AppError(ErrorCode.INTERNAL_ERROR, "Estimate service is not implemented");
}

export async function createEstimate(_companyId: string, _input: CreateEstimateInput): Promise<never> {
  throw new AppError(ErrorCode.INTERNAL_ERROR, "Estimate service is not implemented");
}

export async function getEstimate(_companyId: string, _estimateId: string): Promise<never> {
  throw new AppError(ErrorCode.INTERNAL_ERROR, "Estimate service is not implemented");
}

export async function updateEstimate(
  _companyId: string,
  _estimateId: string,
  _input: UpdateEstimateInput
): Promise<never> {
  throw new AppError(ErrorCode.INTERNAL_ERROR, "Estimate service is not implemented");
}

export async function deleteEstimate(_companyId: string, _estimateId: string): Promise<never> {
  throw new AppError(ErrorCode.INTERNAL_ERROR, "Estimate service is not implemented");
}
