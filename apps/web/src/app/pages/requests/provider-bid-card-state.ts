import type { AppSession } from "@carebid/shared"

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
