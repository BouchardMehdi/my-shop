import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'

export default function AdminLayout({ title, children }: PropsWithChildren<{ title: string }>) {
  return <section className="admin-page">
    <p className="eyebrow">Administration</p>
    <h1>{title}</h1>
    <nav className="admin-nav" aria-label="Administration">
      <NavLink to="/admin" end>Catalogue</NavLink>
      <NavLink to="/admin/orders">Toutes les commandes</NavLink>
    </nav>
    {children}
  </section>
}
