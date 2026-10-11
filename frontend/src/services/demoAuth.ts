const SESSION_KEY = 'aethera_demo_session'

export const DEMO_CREDENTIALS = {
  email: 'demo@aethera.health',
  password: 'AetheraDemo2026!',
  name: 'Aethera Demo',
} as const

export interface DemoUser {
  email: string
  name: string
}

export function signInDemo(email: string, password: string): DemoUser | null {
  if (
    email.trim().toLowerCase() !== DEMO_CREDENTIALS.email ||
    password !== DEMO_CREDENTIALS.password
  ) {
    return null
  }

  const user = { email: DEMO_CREDENTIALS.email, name: DEMO_CREDENTIALS.name }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export function getDemoUser(): DemoUser | null {
  try {
    const session = localStorage.getItem(SESSION_KEY)
    if (!session) return null

    const user: unknown = JSON.parse(session)
    if (
      typeof user === 'object' &&
      user !== null &&
      'email' in user &&
      user.email === DEMO_CREDENTIALS.email &&
      'name' in user &&
      user.name === DEMO_CREDENTIALS.name
    ) {
      return { email: user.email, name: user.name }
    }
  } catch {
    localStorage.removeItem(SESSION_KEY)
  }
  return null
}

export function signOutDemo(): void {
  localStorage.removeItem(SESSION_KEY)
}
