import type { Bid, BidInput } from "../../../lib/api"

export type ProviderBidFormValues = Omit<BidInput, "amount" | "availableDate"> & {
  readonly amount: number | string
  readonly availableDate: Date | string
}

const apiDateFromFormDate = (value: Date | string) => {
  if (typeof value === "string") {
    return value
  }

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const formDateFromApiDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number)

  return new Date(year, month - 1, day)
}

export const providerBidSubmitInput = (
  requestId: string,
  values: ProviderBidFormValues,
): BidInput => ({
  ...values,
  requestId,
  amount: typeof values.amount === "string" ? Number(values.amount) : values.amount,
  availableDate: apiDateFromFormDate(values.availableDate),
  notes: values.notes?.trim() ? values.notes : null,
})

export const providerBidInitialValues = (requestId: string, existingBid?: Bid | null): ProviderBidFormValues => ({
  requestId,
  amount: existingBid?.amount ?? 1200,
  availableDate: existingBid ? formDateFromApiDate(existingBid.availableDate) : new Date(2026, 3, 25),
  notes: existingBid?.notes ?? "Open slot available this week.",
})

export const providerBidFormDateToApiDate = apiDateFromFormDate
