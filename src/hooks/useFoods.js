import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { listFoods } from '../services/foodsApi.js'

export default function useFoods() {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const controllerRef = useRef(null)

  const reload = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const data = await listFoods({ signal: controller.signal })
      if (controller.signal.aborted) return
      setFoods(Array.isArray(data) ? data : [])
    } catch (err) {
      if (controller.signal.aborted || err?.kind === 'aborted') return
      setError(err?.message || 'Não foi possível carregar o estoque.')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch on mount; setState inside the async loader is expected here.
    // eslint-disable-next-line react/set-state-in-effect
    reload()
    return () => controllerRef.current?.abort()
  }, [reload])

  const appendFood = useCallback((food) => {
    setFoods((current) => [...current, food])
  }, [])

  const replaceFood = useCallback((food) => {
    setFoods((current) =>
      current.map((item) => (String(item.id) === String(food.id) ? food : item))
    )
  }, [])

  const removeFood = useCallback((id) => {
    setFoods((current) =>
      current.filter((item) => String(item.id) !== String(id))
    )
  }, [])

  const filteredFoods = useMemo(
    () =>
      selectedCategory
        ? foods.filter((food) => food.category === selectedCategory)
        : foods,
    [foods, selectedCategory]
  )

  return {
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
  }
}
