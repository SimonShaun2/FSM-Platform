"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface EstimateFlowLineItem {
  id: string;
  name: string;
  description?: string;
  itemType: "service" | "labor" | "material" | "fee";
  quantity: number;
  unitPrice: number;
  isTaxable: boolean;
  recommended?: boolean;
}

export interface EstimateUpsellItem {
  id: string;
  title: string;
  description: string;
  value: number;
  added: boolean;
}

interface EstimateFlowContext {
  customerId: string | null;
  propertyId: string | null;
  customerName: string | null;
  assetName: string | null;
  jobTitle: string | null;
}

interface EstimateFlowStore {
  jobId: string | null;
  estimateId: string | null;
  currentStep: number;
  lineItems: EstimateFlowLineItem[];
  quoteMode: "single" | "good_better_best";
  selectedTier: "good" | "better" | "best" | null;
  approvalTimestamp: string | null;
  addedUpsells: EstimateUpsellItem[];
  selectedPlanId: string | null;
  billingCycle: "monthly" | "annual";
  signatureDataUrl: string | null;
  invoiceId: string | null;
  context: EstimateFlowContext;
  setContext: (input: Partial<EstimateFlowContext> & { jobId: string }) => void;
  setEstimateId: (estimateId: string | null) => void;
  setStep: (step: number) => void;
  addLineItem: (item: EstimateFlowLineItem) => void;
  updateLineItem: (itemId: string, patch: Partial<EstimateFlowLineItem>) => void;
  removeLineItem: (itemId: string) => void;
  setQuoteMode: (quoteMode: "single" | "good_better_best") => void;
  setSelectedTier: (tier: "good" | "better" | "best" | null) => void;
  markApproved: (timestamp: string, tier: "good" | "better" | "best" | null) => void;
  setUpsells: (items: EstimateUpsellItem[]) => void;
  toggleUpsell: (upsellId: string) => void;
  setSelectedPlan: (planId: string | null, billingCycle?: "monthly" | "annual") => void;
  setSignatureDataUrl: (signatureDataUrl: string | null) => void;
  setInvoiceId: (invoiceId: string | null) => void;
  reset: () => void;
}

const initialContext: EstimateFlowContext = {
  customerId: null,
  propertyId: null,
  customerName: null,
  assetName: null,
  jobTitle: null
};

function createLineItemId() {
  return `estimate-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useEstimateFlowStore = create<EstimateFlowStore>()(
  persist(
    (set) => ({
      jobId: null,
      estimateId: null,
      currentStep: 1,
      lineItems: [],
      quoteMode: "single",
      selectedTier: null,
      approvalTimestamp: null,
      addedUpsells: [],
      selectedPlanId: null,
      billingCycle: "annual",
      signatureDataUrl: null,
      invoiceId: null,
      context: initialContext,
      setContext: (input) =>
        set((state) => ({
          jobId: input.jobId,
          context: {
            ...state.context,
            ...input
          }
        })),
      setEstimateId: (estimateId) => set({ estimateId }),
      setStep: (currentStep) => set({ currentStep }),
      addLineItem: (item) =>
        set((state) => ({
          lineItems: state.lineItems.some((lineItem) => lineItem.id === item.id)
            ? state.lineItems
            : [
                ...state.lineItems,
                {
                  ...item,
                  id: item.id || createLineItemId()
                }
              ]
        })),
      updateLineItem: (itemId, patch) =>
        set((state) => ({
          lineItems: state.lineItems.map((lineItem) =>
            lineItem.id === itemId ? { ...lineItem, ...patch } : lineItem
          )
        })),
      removeLineItem: (itemId) =>
        set((state) => ({
          lineItems: state.lineItems.filter((lineItem) => lineItem.id !== itemId)
        })),
      setQuoteMode: (quoteMode) => set({ quoteMode }),
      setSelectedTier: (selectedTier) => set({ selectedTier }),
      markApproved: (approvalTimestamp, selectedTier) =>
        set({ approvalTimestamp, selectedTier }),
      setUpsells: (addedUpsells) => set({ addedUpsells }),
      toggleUpsell: (upsellId) =>
        set((state) => ({
          addedUpsells: state.addedUpsells.map((upsell) =>
            upsell.id === upsellId ? { ...upsell, added: !upsell.added } : upsell
          )
        })),
      setSelectedPlan: (selectedPlanId, billingCycle) =>
        set((state) => ({
          selectedPlanId,
          billingCycle: billingCycle ?? state.billingCycle
        })),
      setSignatureDataUrl: (signatureDataUrl) => set({ signatureDataUrl }),
      setInvoiceId: (invoiceId) => set({ invoiceId }),
      reset: () =>
        set({
          jobId: null,
          estimateId: null,
          currentStep: 1,
          lineItems: [],
          quoteMode: "single",
          selectedTier: null,
          approvalTimestamp: null,
          addedUpsells: [],
          selectedPlanId: null,
          billingCycle: "annual",
          signatureDataUrl: null,
          invoiceId: null,
          context: initialContext
        })
    }),
    {
      name: "servicerev-estimate-flow",
      partialize: (state) => ({
        jobId: state.jobId,
        estimateId: state.estimateId,
        currentStep: state.currentStep,
        lineItems: state.lineItems,
        quoteMode: state.quoteMode,
        selectedTier: state.selectedTier,
        approvalTimestamp: state.approvalTimestamp,
        addedUpsells: state.addedUpsells,
        selectedPlanId: state.selectedPlanId,
        billingCycle: state.billingCycle,
        signatureDataUrl: state.signatureDataUrl,
        invoiceId: state.invoiceId,
        context: state.context
      })
    }
  )
);
