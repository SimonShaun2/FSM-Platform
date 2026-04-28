import { AppError, ErrorCode } from "@fsm/types";

export interface CreateInvoiceInput extends Record<string, never> {}
export interface UpdateInvoiceInput extends Record<string, never> {}

export async function listInvoices(_companyId: string): Promise<never> {
  throw new AppError(ErrorCode.INTERNAL_ERROR, "Invoice service is not implemented");
}

export async function createInvoice(_companyId: string, _input: CreateInvoiceInput): Promise<never> {
  throw new AppError(ErrorCode.INTERNAL_ERROR, "Invoice service is not implemented");
}

export async function getInvoice(_companyId: string, _invoiceId: string): Promise<never> {
  throw new AppError(ErrorCode.INTERNAL_ERROR, "Invoice service is not implemented");
}

export async function updateInvoice(
  _companyId: string,
  _invoiceId: string,
  _input: UpdateInvoiceInput
): Promise<never> {
  throw new AppError(ErrorCode.INTERNAL_ERROR, "Invoice service is not implemented");
}

export async function deleteInvoice(_companyId: string, _invoiceId: string): Promise<never> {
  throw new AppError(ErrorCode.INTERNAL_ERROR, "Invoice service is not implemented");
}
