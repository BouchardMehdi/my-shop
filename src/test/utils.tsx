import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext, type AuthValue } from '../features/auth/context'

export function renderWithProviders(ui: ReactElement, url = '/', auth: AuthValue = { session: null, booted: true, error: null }) {
  // A fresh cache per render; a deliberate API error must not trigger retries.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return {
    ...render(<QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <AuthContext.Provider value={auth}>{ui}</AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>),
    queryClient,
  }
}
