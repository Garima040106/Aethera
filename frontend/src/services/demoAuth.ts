const SESSION_KEY = 'aethera_demo_session'

export type DemoRole = 'elder' | 'caregiver'

export const DEMO_ACCOUNTS: Record<DemoRole, { email: string; password: string; name: string }> = {
  elder: {
    email: 'demo@aethera.health',
    password: 'AetheraDemo2026!',
    name: 'Kamla Sharma',
  },
  caregiver: {
    email: 'caregiver@aethera.health',
    password: 'AetheraCare2026!',
    name: 'Rohan Sharma',
  },
}

export const DEMO_CREDENTIALS = DEMO_ACCOUNTS.elder

export interface DemoUser {
  email: string
  name: string
  role: DemoRole
}

export function signInDemo(email: string, password: string, role: DemoRole): DemoUser | null {
  const account = DEMO_ACCOUNTS[role]
  if (
    email.trim().toLowerCase() !== account.email ||
    password !== account.password
  ) {
    return null
  }

  const user: DemoUser = { email: account.email, name: account.name, role }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export function getDemoUser(): DemoUser | null {
  try {
    const session = localStorage.getItem(SESSION_KEY)
    if (!session) return null

    const user: unknown = JSON.parse(session)
    if (typeof user !== 'object' || user === null || !('email' in user) || !('name' in user)) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }

    const legacyElderSession = user.email === DEMO_ACCOUNTS.elder.email && user.name === DEMO_ACCOUNTS.elder.name && !('role' in user)
    const role = legacyElderSession ? 'elder' : 'role' in user ? user.role : null
    if ((role === 'elder' || role === 'caregiver') && user.email === DEMO_ACCOUNTS[role].email && user.name === DEMO_ACCOUNTS[role].name) {
      const validUser: DemoUser = { email: user.email, name: user.name, role }
      if (legacyElderSession) localStorage.setItem(SESSION_KEY, JSON.stringify(validUser))
      return validUser
    }
  } catch {
    localStorage.removeItem(SESSION_KEY)
  }
  return null
}

export function signOutDemo(): void {
  localStorage.removeItem(SESSION_KEY)
}
