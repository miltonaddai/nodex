export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE !== 'false'
}

export function createDemoSession(email: string) {
  const normalized = email.trim()
  const payload = `demo:${normalized}`
  const token = btoa(payload)

  return {
    token,
    user: { id: payload, email: normalized },
  }
}
