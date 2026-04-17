interface ConfirmModalProps {
  title: string
  description: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmModal({
  title,
  description,
  confirmLabel = 'Xác nhận',
  onCancel,
  onConfirm
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-3 text-slate-600">{description}</p>
        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button type="button" className="rounded-2xl border border-slate-300 px-4 py-2 text-sm" onClick={onCancel}>
            Hủy
          </button>
          <button type="button" className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
