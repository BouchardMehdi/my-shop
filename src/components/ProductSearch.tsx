import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'

export default function ProductSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const [field, setField] = useState({ urlSearch: search, value: search })
  // The local value is a form draft. Links and Back reset it to the URL value.
  if (field.urlSearch !== search) setField({ urlSearch: search, value: search })

  function updateSearch(value: string) {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      if (value) next.set('search', value)
      else next.delete('search')
      return next
    }, { replace: true })
  }

  return <form className="catalog-search" role="search" aria-label="Recherche du catalogue" onSubmit={event => { event.preventDefault(); updateSearch(field.value) }}>
    <label htmlFor="catalog-search">Rechercher un produit</label>
    <input id="catalog-search" type="search" name="search" autoComplete="off" placeholder="Ex. : lampe"
      value={field.value} onChange={event => setField({ urlSearch: search, value: event.target.value })} />
    <button className="add-button" type="submit">Rechercher</button>
    {(search || field.value) && <button className="add-button" type="button" onClick={() => { setField({ urlSearch: search, value: '' }); updateSearch('') }}>Effacer la recherche</button>}
  </form>
}
