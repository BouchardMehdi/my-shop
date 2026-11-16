import { useEffect, useId, useRef, type PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
  title: string
  pending: boolean
  error?: string
  onCancel: () => void
  onConfirm: () => void
}>

export default function ConfirmDialog({ title, children, pending, error, onCancel, onConfirm }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    element?.showModal()
    return () => {
      element?.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [])
  return <dialog ref={dialog} className="confirm-dialog" aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); if (!pending) onCancel() }}>
    <h2 id={titleId}>{title}</h2>
    <div id={descriptionId}>{children}</div>
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="admin-actions">
      <button className="add-button" type="button" autoFocus disabled={pending} onClick={onCancel}>Annuler</button>
      <button className="add-button danger-button" type="button" disabled={pending} onClick={onConfirm}>{pending ? 'Suppression…' : 'Supprimer définitivement'}</button>
    </div>
  </dialog>
}
