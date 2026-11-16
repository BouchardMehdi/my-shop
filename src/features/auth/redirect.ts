// Never redirect to a user-provided external URL or back into an auth form.
export function authDestination(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state) || typeof state.from !== 'string') return '/account'
  const from = state.from
  if (!from.startsWith('/') || from.startsWith('//') || from.includes('\\') || /[\r\n]/.test(from)) return '/account'
  const pathname = from.split(/[?#]/)[0]
  return pathname === '/login' || pathname === '/signup' ? '/account' : from
}
