import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthPage from './AuthPage'
import { renderWithProviders } from '../test/utils'

const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn() }))
vi.mock('../lib/supabase', () => ({ getSupabase: () => ({ auth: { signInWithPassword } }) }))

beforeEach(() => {
  signInWithPassword.mockReset()
  signInWithPassword.mockResolvedValue({ error: new Error('Identifiants invalides.') })
})

describe('connexion', () => {
  it('affiche l’erreur du serveur pour des identifiants invalides', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AuthPage mode="login" />, '/login')
    await user.type(screen.getByLabelText('Adresse e-mail'), 'client@example.test')
    await user.type(screen.getByLabelText('Mot de passe'), 'incorrect')

    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Identifiants invalides.')
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'client@example.test', password: 'incorrect' })
  })

  it('ne soumet pas la connexion sans adresse e-mail', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AuthPage mode="login" />, '/login')
    await user.type(screen.getByLabelText('Mot de passe'), 'incorrect')

    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(screen.getByLabelText('Adresse e-mail')).toBeInvalid()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('ne soumet pas la connexion sans mot de passe', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AuthPage mode="login" />, '/login')
    await user.type(screen.getByLabelText('Adresse e-mail'), 'client@example.test')

    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(screen.getByLabelText('Mot de passe')).toBeInvalid()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })
})
