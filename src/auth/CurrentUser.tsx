import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { USER_NAME } from '../dashboard/constants'

export interface CurrentUser {
  readonly name: string
  readonly email: string
  /** Null when nobody is signed in (a guest who came by a meeting link) */
  readonly signOut: (() => void) | null
}

const GUEST: CurrentUser = { name: USER_NAME, email: '', signOut: null }

const CurrentUserContext = createContext<CurrentUser>(GUEST)

export function CurrentUserProvider({ user, children }: { user: CurrentUser | null; children: ReactNode }) {
  return <CurrentUserContext.Provider value={user ?? GUEST}>{children}</CurrentUserContext.Provider>
}

export function useCurrentUser(): CurrentUser {
  return useContext(CurrentUserContext)
}
