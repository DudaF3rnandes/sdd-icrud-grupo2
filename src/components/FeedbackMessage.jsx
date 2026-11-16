export default function FeedbackMessage({
  variant = 'success',
  message,
  onRetry,
  onDismiss,
}) {
  if (!message) return null

  const isError = variant === 'error'

  return (
    <div
      className={`feedback feedback--${variant}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <p className="feedback__text">{message}</p>
      <div className="feedback__actions">
        {onRetry && (
          <button type="button" className="button button--ghost" onClick={onRetry}>
            Tentar novamente
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            className="button button--ghost"
            onClick={onDismiss}
            aria-label="Fechar mensagem"
          >
            Fechar
          </button>
        )}
      </div>
    </div>
  )
}
