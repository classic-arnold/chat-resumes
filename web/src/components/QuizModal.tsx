import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/react'

import { fetchQuiz, saveQuiz, type QuizAnswers } from '../lib/quiz'
import { quizQuestions, QUIZ_TOTAL, type QuizQuestionId } from '../lib/quizQuestions'
import { Button } from './ui/Button'

type QuizModalProps = {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

const MAX_CHARS = 2000

export const QuizModal = ({ isOpen, onClose, onSaved }: QuizModalProps) => {
  const { getToken } = useAuth()
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await fetchQuiz(getToken)
        if (cancelled) return
        setAnswers(result.answers ?? {})
      } catch (caught) {
        if (cancelled) return
        setError(caught instanceof Error ? caught.message : 'Unable to load quiz.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [getToken, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleChange = (id: QuizQuestionId, value: string) => {
    setAnswers((current) => ({ ...current, [id]: value.slice(0, MAX_CHARS) }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const payload: Partial<Record<QuizQuestionId, string | null>> = {}
      for (const question of quizQuestions) {
        const value = answers[question.id]
        payload[question.id] = value && value.trim().length > 0 ? value : null
      }
      await saveQuiz(getToken, payload)
      onSaved?.()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save quiz.')
    } finally {
      setIsSaving(false)
    }
  }

  const answeredCount = quizQuestions.reduce((acc, question) => {
    const value = answers[question.id]
    return value && value.trim().length > 0 ? acc + 1 : acc
  }, 0)

  return (
    <div
      className="quiz-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Intake quiz"
    >
      <div className="quiz-modal">
        <div className="quiz-modal-header">
          <div>
            <div className="quiz-modal-eyebrow">Intake quiz</div>
            <div className="quiz-modal-title">The 5 questions recruiters ask</div>
            <div className="quiz-modal-progress">
              {answeredCount} / {QUIZ_TOTAL} answered
            </div>
          </div>
          <button
            aria-label="Close"
            className="quiz-modal-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="quiz-modal-body">
          {isLoading ? (
            <div className="ui-status-text">Loading…</div>
          ) : (
            quizQuestions.map((question) => {
              const value = answers[question.id] ?? ''
              return (
                <div className="quiz-q" key={question.id}>
                  <div className="quiz-q-meta">
                    <span className="quiz-q-num">{question.number}</span>
                    <span className="quiz-q-cat">{question.category}</span>
                  </div>
                  <label className="quiz-q-text" htmlFor={`quiz-${question.id}`}>
                    {question.text}
                  </label>
                  <textarea
                    className="quiz-q-textarea"
                    id={`quiz-${question.id}`}
                    maxLength={MAX_CHARS}
                    onChange={(event) => handleChange(question.id, event.target.value)}
                    placeholder="Your answer…"
                    rows={4}
                    value={value}
                  />
                  <div className="quiz-q-footer">
                    <span className="quiz-q-hint">{question.hint}</span>
                    <span className="quiz-q-count">
                      {value.length} / {MAX_CHARS}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          {error ? <div className="ui-error-text">{error}</div> : null}
        </div>

        <div className="quiz-modal-footer">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button disabled={isSaving || isLoading} onClick={() => void handleSave()} variant="primary">
            {isSaving ? 'Saving…' : 'Save & close'}
          </Button>
        </div>
      </div>
    </div>
  )
}
