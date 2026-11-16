import { useState } from 'react'
import CategoryFilter from '../components/CategoryFilter.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import FeedbackMessage from '../components/FeedbackMessage.jsx'
import FoodForm from '../components/FoodForm.jsx'
import FoodList from '../components/FoodList.jsx'
import useFoods from '../hooks/useFoods.js'
import { createFood, deleteFood, updateFood } from '../services/foodsApi.js'
import '../styles/inventory.css'

const CREATE_VALUES = { name: '', quantity: '', unit: '', category: '' }

export default function InventoryPage() {
  const {
    foods,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    filteredFoods,
    reload,
    appendFood,
    replaceFood,
    removeFood,
  } = useFoods()

  const [formKey, setFormKey] = useState(0)
  const [editingFood, setEditingFood] = useState(null)
  const [formInitialValues, setFormInitialValues] = useState(CREATE_VALUES)
  const [submitting, setSubmitting] = useState(false)
  const [serverFieldErrors, setServerFieldErrors] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const [foodToDelete, setFoodToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const resetForm = () => {
    setEditingFood(null)
    setFormInitialValues(CREATE_VALUES)
    setServerFieldErrors(null)
    setFormKey((key) => key + 1)
  }

  const handleCreate = async (values) => {
    setSubmitting(true)
    setServerFieldErrors(null)
    setFeedback(null)

    try {
      const created = await createFood(values)
      appendFood(created)
      setFeedback({ variant: 'success', message: 'Alimento cadastrado com sucesso.' })
      resetForm()
    } catch (err) {
      setFeedback({ variant: 'error', message: err.message })
      setServerFieldErrors(err.fieldErrors || null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (values) => {
    setSubmitting(true)
    setServerFieldErrors(null)
    setFeedback(null)

    try {
      const updated = await updateFood(editingFood.id, values)
      replaceFood(updated)
      setFeedback({ variant: 'success', message: 'Alimento atualizado com sucesso.' })
      resetForm()
    } catch (err) {
      setFeedback({ variant: 'error', message: err.message })
      setServerFieldErrors(err.fieldErrors || null)
      if (err.status === 404) reload()
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (values) => {
    if (editingFood) return handleUpdate(values)
    return handleCreate(values)
  }

  const openEdit = (food) => {
    setEditingFood(food)
    setFormInitialValues({
      name: food.name,
      quantity: String(food.quantity),
      unit: food.unit,
      category: food.category,
    })
    setServerFieldErrors(null)
    setFeedback(null)
    setFormKey((key) => key + 1)
  }

  const cancelEdit = () => {
    resetForm()
    setFeedback(null)
  }

  const requestDelete = (food) => {
    setFoodToDelete(food)
  }

  const confirmDelete = async () => {
    if (!foodToDelete) return
    setDeleting(true)
    setFeedback(null)

    try {
      await deleteFood(foodToDelete.id)
      removeFood(foodToDelete.id)
      setFeedback({ variant: 'success', message: 'Alimento excluído com sucesso.' })
    } catch (err) {
      setFeedback({ variant: 'error', message: err.message })
      if (err.status === 404) reload()
    } finally {
      setDeleting(false)
      setFoodToDelete(null)
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>iCRUD — Controle de Estoque</h1>
        <p>Cadastre, consulte, edite e exclua os alimentos do restaurante.</p>
      </header>

      <div className="layout">
        <section className="list-panel" aria-labelledby="inventory-list-title">
          <div className="list-header">
            <h2 id="inventory-list-title">Estoque</h2>
            <CategoryFilter
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>

          <FoodList
            foods={filteredFoods}
            loading={loading}
            error={error}
            hasAnyFoods={foods.length > 0}
            selectedCategory={selectedCategory}
            onRetry={reload}
            onEdit={openEdit}
            onDelete={requestDelete}
            deletingId={deleting ? foodToDelete?.id : null}
          />
        </section>

        <div className="form-column">
          {feedback && (
            <FeedbackMessage
              variant={feedback.variant}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          )}

          <FoodForm
            key={formKey}
            mode={editingFood ? 'edit' : 'create'}
            initialValues={formInitialValues}
            submitting={submitting}
            serverFieldErrors={serverFieldErrors}
            onSubmit={handleSubmit}
            onCancel={editingFood ? cancelEdit : undefined}
          />
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(foodToDelete)}
        message={
          foodToDelete
            ? `Tem certeza de que deseja excluir "${foodToDelete.name}"? Esta ação não pode ser desfeita.`
            : ''
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setFoodToDelete(null)}
      />
    </main>
  )
}
