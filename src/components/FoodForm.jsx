import { useId, useState } from 'react'
import { CATEGORIES, UNITS } from '../lib/constants.js'
import { validateFood } from '../lib/validation.js'

const EMPTY_VALUES = { name: '', quantity: '', unit: '', category: '' }

export default function FoodForm({
  mode = 'create',
  initialValues = EMPTY_VALUES,
  submitting = false,
  serverFieldErrors = null,
  onSubmit,
  onCancel,
}) {
  const ids = {
    name: useId(),
    quantity: useId(),
    unit: useId(),
    category: useId(),
  }
  const [values, setValues] = useState(() => ({ ...EMPTY_VALUES, ...initialValues }))
  const [errors, setErrors] = useState({})

  const fieldErrors = { ...errors, ...(serverFieldErrors || {}) }
  const isEdit = mode === 'edit'
  const title = isEdit ? `Editar ${initialValues?.name ?? 'alimento'}` : 'Novo alimento'

  const updateField = (field) => (event) => {
    const { value } = event.target
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const validateField = (field) => () => {
    const fieldErrorsForValue = validateFood(values)
    setErrors((current) => ({
      ...current,
      [field]: fieldErrorsForValue[field],
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const cleaned = {
      name: values.name.trim(),
      quantity: values.quantity,
      unit: values.unit,
      category: values.category,
    }
    const nextErrors = validateFood(cleaned)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      ...cleaned,
      quantity: Number(cleaned.quantity),
    })
  }

  const describedBy = (field) =>
    fieldErrors[field] ? `${ids[field]}-error` : undefined

  return (
    <section className="form-panel" aria-labelledby="food-form-title">
      <h2 id="food-form-title">{title}</h2>
      <form className="food-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor={ids.name}>Nome</label>
          <input
            id={ids.name}
            name="name"
            type="text"
            value={values.name}
            onChange={updateField('name')}
            onBlur={validateField('name')}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={describedBy('name')}
            autoComplete="off"
          />
          {fieldErrors.name && (
            <p className="field__error" id={`${ids.name}-error`}>
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={ids.quantity}>Quantidade em estoque</label>
          <input
            id={ids.quantity}
            name="quantity"
            type="number"
            inputMode="decimal"
            step="0.001"
            min="0"
            max="99999.999"
            value={values.quantity}
            onChange={updateField('quantity')}
            onBlur={validateField('quantity')}
            aria-invalid={Boolean(fieldErrors.quantity)}
            aria-describedby={describedBy('quantity')}
          />
          {fieldErrors.quantity && (
            <p className="field__error" id={`${ids.quantity}-error`}>
              {fieldErrors.quantity}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={ids.category}>Categoria</label>
          <select
            id={ids.category}
            name="category"
            value={values.category}
            onChange={updateField('category')}
            onBlur={validateField('category')}
            aria-invalid={Boolean(fieldErrors.category)}
            aria-describedby={describedBy('category')}
          >
            <option value="">Selecione uma categoria</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {fieldErrors.category && (
            <p className="field__error" id={`${ids.category}-error`}>
              {fieldErrors.category}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={ids.unit}>Unidade de medida</label>
          <select
            id={ids.unit}
            name="unit"
            value={values.unit}
            onChange={updateField('unit')}
            onBlur={validateField('unit')}
            aria-invalid={Boolean(fieldErrors.unit)}
            aria-describedby={describedBy('unit')}
          >
            <option value="">Selecione uma unidade</option>
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          {fieldErrors.unit && (
            <p className="field__error" id={`${ids.unit}-error`}>
              {fieldErrors.unit}
            </p>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="button button--primary" disabled={submitting}>
            {isEdit ? 'Salvar alterações' : 'Cadastrar alimento'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="button button--ghost"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
