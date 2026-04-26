import type { AppSession } from "@carebid/shared"
import type { Bid } from "../../../lib/api"

export const getProviderBidActor = (session: AppSession | null) => {
  const provider = session?.providerProfile

  if (!provider) {
    return null
  }

  return {
    providerId: provider.id,
    providerDisplayName: provider.displayName,
  }
}

export const getProviderExistingBid = (
  providerId: string | null | undefined,
  bids: ReadonlyArray<Bid>,
) => {
  if (!providerId) {
    return null
  }

  return bids.find((bid) => bid.providerId === providerId) ?? null
}
