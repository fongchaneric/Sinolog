export const STATUS_META = {
  pending: { label: 'En attente de confirmation', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Paiement confirmé', color: 'bg-blue-100 text-blue-700' },
  purchasing: { label: 'Achat en cours', color: 'bg-indigo-100 text-indigo-700' },
  shipped: { label: "En cours d'expédition", color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Terminé / Reçu', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Refusé', color: 'bg-red-100 text-red-700' }
}

export function statusMeta(status) {
  return STATUS_META[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
}
