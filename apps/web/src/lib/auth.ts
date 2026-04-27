import { getApp, getApps, initializeApp } from "firebase/app"
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const authEmulatorUrl = import.meta.env.DEV ? import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL : undefined

const authTokenStorageKey = "carebid.auth-token"
let authEmulatorConnected = false

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const authClient = getAuth(app)

if (authEmulatorUrl && !authEmulatorConnected) {
  connectAuthEmulator(authClient, authEmulatorUrl, { disableWarnings: true })
  authEmulatorConnected = true
}

export type AuthSession = {
  user: { id: string; email: string; name: string }
}

const mapUser = (user: User | null) =>
  user
    ? {
        id: user.uid,
        email: user.email ?? "",
        name: user.displayName ?? user.email ?? "",
      }
    : null

export const setStoredAuthToken = (token: string | null) => {
  if (typeof window === "undefined") {
    return
  }

  if (token) {
    window.localStorage.setItem(authTokenStorageKey, token)
    return
  }

  window.localStorage.removeItem(authTokenStorageKey)
}

export const clearAuthSession = async () => {
  try {
    await signOut(authClient)
  } catch {
    // Ignore sign-out failures and still clear local auth state.
  }

  setStoredAuthToken(null)
}

const getStoredAuthToken = (): string | null => {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(authTokenStorageKey)
}

export const getCurrentAuthUser = () => mapUser(authClient.currentUser)

export const observeAuthUser = (callback: (user: AuthSession["user"] | null) => void) =>
  onIdTokenChanged(authClient, async (user) => {
    if (user) {
      try {
        setStoredAuthToken(await user.getIdToken())
      } catch {
        await clearAuthSession()
        callback(null)
        return
      }
    } else {
      setStoredAuthToken(null)
    }

    callback(mapUser(user))
  })

export const signInUser = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(authClient, email, password)
  setStoredAuthToken(await credential.user.getIdToken())
  return mapUser(credential.user)
}

export const signUpUser = async (name: string, email: string, password: string) => {
  const credential = await createUserWithEmailAndPassword(authClient, email, password)
  await updateProfile(credential.user, { displayName: name })
  setStoredAuthToken(await credential.user.getIdToken())
  return mapUser(credential.user)
}

export const signOutUser = async () => {
  await clearAuthSession()
}

export const getAuthToken = async (): Promise<string | null> => {
  const currentUser = authClient.currentUser
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken()
      setStoredAuthToken(token)
      return token
    } catch {
      await clearAuthSession()
      return null
    }
  }

  return getStoredAuthToken()
}
