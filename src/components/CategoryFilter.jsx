import { CATEGORIES } from '../lib/constants.js'

export default function CategoryFilter({ value, onChange }) {
  const id = 'category-filter'

  return (
    <div className="filter">
      <label htmlFor={id}>Filtrar por categoria</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Todas</option>
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  )
}
