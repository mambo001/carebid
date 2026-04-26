import type { Bid, BidInput } from "../../../lib/api"

type ProviderBidFormValues = Omit<BidInput, "amount"> & {
  readonly amount: number | string
}

export const providerBidSubmitInput = (
  requestId: string,
  values: ProviderBidFormValues,
): BidInput => ({
  ...values,
  requestId,
  amount: typeof values.amount === "string" ? Number(values.amount) : values.amount,
  notes: values.notes?.trim() ? values.notes : null,
})

export const providerBidInitialValues = (requestId: string, existingBid?: Bid | null): BidInput => ({
  requestId,
  amount: existingBid?.amount ?? 1200,
  availableDate: existingBid?.availableDate.slice(0, 10) ?? "2026-04-25",
  notes: existingBid?.notes ?? "Open slot available this week.",
})
