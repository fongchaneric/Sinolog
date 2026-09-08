export const STATUS_META = {
  pending: { label: 'Miandry fanamafisana', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Voamarina ny payment', color: 'bg-blue-100 text-blue-700' },
  purchasing: { label: "Mividy any 1688 izahay", color: 'bg-indigo-100 text-indigo-700' },
  shipped: { label: 'Eo am-pandefasana', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Tapitra / Voaray', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Nolavina', color: 'bg-red-100 text-red-700' }
}

export function statusMeta(status) {
  return STATUS_META[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
}
