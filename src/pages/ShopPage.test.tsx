import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ShopPage from './ShopPage'
import { renderWithProviders } from '../test/utils'

const { readProducts } = vi.hoisted(() => ({ readProducts: vi.fn() }))

vi.mock('../lib/supabase', () => {
  const rows = [
    { id: '10000000-0000-4000-8000-000000000001', slug: 'lampe-aria', name: 'Lampe Aria', price: 42, image_url: '/lampe.webp', description: 'Une lampe.', category: 'Lumière', in_stock: true, badge: null, display_order: 0 },
    { id: '20000000-0000-4000-8000-000000000002', slug: 'table-nord', name: 'Table Nord', price: 120, image_url: '/table.webp', description: 'Une table.', category: 'Mobilier', in_stock: true, badge: null, display_order: 1 },
  ]
  readProducts.mockResolvedValue({ data: rows, error: null })
  // Match the real select -> order -> order -> abortSignal query boundary.
  return { getSupabase: () => ({ from: () => ({ select: () => ({ order: () => ({ order: () => ({ abortSignal: readProducts }) }) }) }) }) }
})

function LocationDisplay() {
  const location = useLocation()
  const navigate = useNavigate()
  return <>
    <output aria-label="URL actuelle">{location.pathname}{location.search}</output>
    <Link to="/?search=table">Voir les tables</Link>
    <button onClick={() => void navigate(-1)}>Page précédente du test</button>
  </>
}

function renderShop(url: string) {
  return renderWithProviders(<><ShopPage /><LocationDisplay /></>, url)
}

beforeEach(() => { readProducts.mockClear() })

describe('ShopPage', () => {
  it('applique le filtre fourni dans l’URL dès l’ouverture', async () => {
    renderShop('/?search=LAMP')

    expect(await screen.findByRole('heading', { name: 'Lampe Aria' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Table Nord' })).not.toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Rechercher un produit' })).toHaveValue('LAMP')
    expect(screen.getByRole('heading', { name: /À découvrir 01/ })).toBeInTheDocument()
  })

  it('applique la recherche validée et conserve les autres paramètres URL', async () => {
    const user = userEvent.setup()
    renderShop('/?sort=price')
    await screen.findByRole('heading', { name: 'Table Nord' })

    await user.type(screen.getByRole('searchbox', { name: 'Rechercher un produit' }), 'LamP')
    expect(screen.getByRole('heading', { name: 'Table Nord' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Rechercher' }))

    expect(screen.getByRole('heading', { name: 'Lampe Aria' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Table Nord' })).not.toBeInTheDocument()
    const url = new URL(screen.getByRole('status', { name: 'URL actuelle' }).textContent!, 'http://localhost')
    expect(url.searchParams.get('search')).toBe('LamP')
    expect(url.searchParams.get('sort')).toBe('price')
  })

  it('retire le filtre de l’URL quand la recherche est effacée', async () => {
    const user = userEvent.setup()
    renderShop('/?sort=price&search=lamp')
    await screen.findByRole('heading', { name: 'Lampe Aria' })

    await user.click(screen.getByRole('button', { name: 'Effacer la recherche' }))

    expect(await screen.findByRole('heading', { name: 'Table Nord' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Rechercher un produit' })).toHaveValue('')
    const url = new URL(screen.getByRole('status', { name: 'URL actuelle' }).textContent!, 'http://localhost')
    expect(url.searchParams.has('search')).toBe(false)
    expect(url.searchParams.get('sort')).toBe('price')
  })

  it('synchronise le champ après un lien et un retour dans l’historique', async () => {
    const user = userEvent.setup()
    renderShop('/?search=lamp')
    await screen.findByRole('heading', { name: 'Lampe Aria' })

    await user.click(screen.getByRole('link', { name: 'Voir les tables' }))

    expect(await screen.findByRole('heading', { name: 'Table Nord' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Rechercher un produit' })).toHaveValue('table')
    await user.click(screen.getByRole('button', { name: 'Page précédente du test' }))
    expect(await screen.findByRole('heading', { name: 'Lampe Aria' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Rechercher un produit' })).toHaveValue('lamp')
  })

  it('annonce une recherche sans résultat', async () => {
    renderShop('/?search=chaise')

    expect(await screen.findByText('Aucun produit ne correspond à votre recherche.')).toBeInTheDocument()
    expect(screen.queryAllByRole('article')).toHaveLength(0)
    expect(screen.getByRole('heading', { name: /À découvrir 00/ })).toBeInTheDocument()
  })

  it('affiche une erreur de catalogue sans réessayer la requête', async () => {
    readProducts.mockResolvedValueOnce({ data: null, error: { message: 'Catalogue indisponible.' } })
    renderShop('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Catalogue indisponible.')
    expect(readProducts).toHaveBeenCalledTimes(1)
  })
})
