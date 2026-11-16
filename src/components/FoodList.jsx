import StatusBadge from './StatusBadge.jsx'
import { getStockStatus } from '../lib/stockStatus.js'

export default function FoodList({
  foods,
  loading,
  error,
  hasAnyFoods = true,
  selectedCategory = '',
  onRetry,
  onEdit,
  onDelete,
  deletingId = null,
}) {
  if (loading) {
    return (
      <p className="list-state" role="status">
        Carregando estoque...
      </p>
    )
  }

  if (error) {
    return (
      <div className="list-state list-state--error" role="alert">
        <p>{error}</p>
        {onRetry && (
          <button type="button" className="button button--ghost" onClick={onRetry}>
            Tentar novamente
          </button>
        )}
      </div>
    )
  }

  if (!foods.length) {
    return (
      <p className="list-state">
        {hasAnyFoods && selectedCategory
          ? 'Nenhum alimento nesta categoria.'
          : 'Nenhum alimento cadastrado.'}
      </p>
    )
  }

  return (
    <div className="table-wrapper">
      <table className="food-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Quantidade</th>
            <th scope="col">Unidade</th>
            <th scope="col">Categoria</th>
            <th scope="col">Status</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {foods.map((food) => (
            <tr key={food.id}>
              <td data-label="Nome">{food.name}</td>
              <td data-label="Quantidade">{food.quantity}</td>
              <td data-label="Unidade">{food.unit}</td>
              <td data-label="Categoria">{food.category}</td>
              <td data-label="Status">
                <StatusBadge status={getStockStatus(food.quantity)} />
              </td>
              <td data-label="Ações" className="row-actions">
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => onEdit?.(food)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="button button--danger"
                  onClick={() => onDelete?.(food)}
                  disabled={deletingId === food.id}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
