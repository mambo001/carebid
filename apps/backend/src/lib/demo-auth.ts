import type {
  AppSession,
  PatientOnboardingInput,
  PatientProfile,
  ProviderOnboardingInput,
  ProviderProfile,
} from "@carebid/shared"

const demoAuthUserId = "demo-user-001"
const demoEmail = "demo@carebid.local"

let patientProfile: PatientProfile | undefined
let providerProfile: ProviderProfile | undefined
let activeRole: AppSession["role"]

const baseSession = (): AppSession => ({
  mode: "demo",
  authUserId: demoAuthUserId,
  email: demoEmail,
  role: activeRole,
  patientProfile,
  providerProfile,
})

export const getDemoSession = (): AppSession => baseSession()

export const onboardPatient = (input: PatientOnboardingInput) => {
  patientProfile = {
    id: `pat-${crypto.randomUUID()}`,
    authUserId: demoAuthUserId,
    email: input.email,
    displayName: input.displayName,
    locationCity: input.locationCity,
    locationRegion: input.locationRegion,
  }

  activeRole = "patient"

  return {
    profile: patientProfile,
    session: baseSession(),
  }
}

export const onboardProvider = (input: ProviderOnboardingInput) => {
  providerProfile = {
    id: `pro-${crypto.randomUUID()}`,
    authUserId: demoAuthUserId,
    email: input.email,
    displayName: input.displayName,
    licenseRegion: input.licenseRegion,
    verificationStatus: "verified",
    verificationMode: "demo_auto",
    categories: input.categories,
  }

  activeRole = "provider"

  return {
    profile: providerProfile,
    session: baseSession(),
  }
}

export const switchDemoRole = (role: AppSession["role"]) => {
  activeRole = role

  return baseSession()
}
