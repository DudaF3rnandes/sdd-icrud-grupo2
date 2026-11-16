import { getStatusLabel } from '../lib/stockStatus.js'

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge--${status}`} data-status={status}>
      {getStatusLabel(status)}
    </span>
  )
}
