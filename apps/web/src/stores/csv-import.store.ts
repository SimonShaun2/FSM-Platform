"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ColumnMapping } from "@fsm/types";

export type DuplicateAction = "skip" | "update_existing" | "import_new";

export interface ParsedImportRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface ImportPreviewRow {
  rowNumber: number;
  mappedValues: Record<string, string>;
}

export interface DuplicateMatchRecord {
  rowNumber: number;
  rowLabel: string;
  sourceValues: Record<string, string>;
  matchedCustomerId: string;
  matchedCustomerName: string;
  matchedCustomerEmail: string | null;
  matchedCustomerPhone: string | null;
  matchReason: "email" | "phone" | "name";
  action: DuplicateAction;
}

export interface ImportResults {
  status: "completed" | "failed";
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  duplicateRows: number;
  totalRows: number;
  completedAt: string | null;
  errorMessage: string | null;
}

interface ParsedImportPayload {
  file: File | null;
  fileName: string;
  headers: string[];
  rawRows: ParsedImportRow[];
  sampleRows: ParsedImportRow[];
}

interface CSVImportStore {
  currentStep: number;
  file: File | null;
  fileName: string | null;
  uploadId: string | null;
  headers: string[];
  sampleRows: ParsedImportRow[];
  rawRows: ParsedImportRow[];
  mappings: ColumnMapping;
  previewRows: ImportPreviewRow[];
  duplicateCount: number;
  duplicateMatches: DuplicateMatchRecord[];
  importJobId: string | null;
  importStartedAt: string | null;
  validationErrorsCount: number;
  results: ImportResults | null;
  setStep: (step: number) => void;
  setParsedFile: (payload: ParsedImportPayload) => void;
  setUploadSession: (uploadId: string, mappings: ColumnMapping, fileName?: string | null) => void;
  setMappings: (mappings: ColumnMapping) => void;
  setPreviewRows: (previewRows: ImportPreviewRow[]) => void;
  setDuplicateMatches: (matches: DuplicateMatchRecord[]) => void;
  setDuplicateAction: (rowNumber: number, action: DuplicateAction) => void;
  setValidationErrorsCount: (count: number) => void;
  setImportStarted: (importJobId: string, startedAt: string) => void;
  setResults: (results: ImportResults | null) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1,
  file: null,
  fileName: null,
  uploadId: null,
  headers: [],
  sampleRows: [],
  rawRows: [],
  mappings: {},
  previewRows: [],
  duplicateCount: 0,
  duplicateMatches: [],
  importJobId: null,
  importStartedAt: null,
  validationErrorsCount: 0,
  results: null
} satisfies Omit<
  CSVImportStore,
  | "setStep"
  | "setParsedFile"
  | "setUploadSession"
  | "setMappings"
  | "setPreviewRows"
  | "setDuplicateMatches"
  | "setDuplicateAction"
  | "setValidationErrorsCount"
  | "setImportStarted"
  | "setResults"
  | "reset"
>;

export const useCSVImportStore = create<CSVImportStore>()(
  persist(
    (set) => ({
      ...initialState,
      setStep: (currentStep) => set({ currentStep }),
      setParsedFile: ({ file, fileName, headers, rawRows, sampleRows }) =>
        set({
          ...initialState,
          file,
          fileName,
          headers,
          rawRows,
          sampleRows
        }),
      setUploadSession: (uploadId, mappings, fileName) =>
        set((state) => ({
          uploadId,
          mappings,
          fileName: fileName ?? state.fileName,
          previewRows: [],
          duplicateCount: 0,
          duplicateMatches: [],
          importJobId: null,
          importStartedAt: null,
          validationErrorsCount: 0,
          results: null
        })),
      setMappings: (mappings) => set({ mappings }),
      setPreviewRows: (previewRows) => set({ previewRows }),
      setDuplicateMatches: (duplicateMatches) =>
        set({
          duplicateMatches,
          duplicateCount: duplicateMatches.length
        }),
      setDuplicateAction: (rowNumber, action) =>
        set((state) => ({
          duplicateMatches: state.duplicateMatches.map((match) =>
            match.rowNumber === rowNumber ? { ...match, action } : match
          )
        })),
      setValidationErrorsCount: (validationErrorsCount) => set({ validationErrorsCount }),
      setImportStarted: (importJobId, importStartedAt) =>
        set({
          importJobId,
          importStartedAt
        }),
      setResults: (results) => set({ results }),
      reset: () => set({ ...initialState })
    }),
    {
      name: "servicerev-csv-import",
      partialize: (state) => ({
        currentStep: state.currentStep,
        fileName: state.fileName,
        uploadId: state.uploadId,
        headers: state.headers,
        sampleRows: state.sampleRows,
        mappings: state.mappings,
        previewRows: state.previewRows,
        duplicateCount: state.duplicateCount,
        duplicateMatches: state.duplicateMatches,
        importJobId: state.importJobId,
        importStartedAt: state.importStartedAt,
        validationErrorsCount: state.validationErrorsCount,
        results: state.results
      })
    }
  )
);
