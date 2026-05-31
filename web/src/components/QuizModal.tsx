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
      className="fixed inset-0 bg-[#0f172a]/55 flex items-center justify-center p-[1rem] z-[1000] backdrop-blur-[4px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Intake quiz"
    >
      <div className="bg-white rounded-[16px] w-full max-w-[720px] max-h-[90vh] flex flex-col shadow-[0_24px_60px_rgba(15,23,42,0.25)] overflow-hidden">
        <div className="flex items-start justify-between p-[1.25rem_1.5rem] border-b border-border gap-[1rem]">
          <div>
            <div className="text-[0.7rem] uppercase tracking-[0.08em] text-muted">Intake quiz</div>
            <div className="font-inter font-bold text-[1.1rem] text-navy-text mt-[0.2rem]">The 5 questions recruiters ask</div>
            <div className="text-[0.78rem] text-muted mt-[0.25rem]">
              {answeredCount} / {QUIZ_TOTAL} answered
            </div>
          </div>
          <button
            aria-label="Close"
            className="bg-transparent border-none text-[1.6rem] leading-[1] cursor-pointer text-muted hover:text-navy-text p-[0.25rem_0.5rem]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="p-[1.25rem_1.5rem] overflow-y-auto flex flex-col gap-[1.25rem]">
          {isLoading ? (
            <div className="text-[0.74rem] text-muted">Loading…</div>
          ) : (
            quizQuestions.map((question) => {
              const value = answers[question.id] ?? ''
              return (
                <div className="flex flex-col gap-[0.4rem]" key={question.id}>
                  <div className="flex items-center gap-[0.5rem] text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                    <span>{question.number}</span>
                    <span className="bg-[#f1f5f9] rounded-full p-[0.1rem_0.55rem]">{question.category}</span>
                  </div>
                  <label className="font-inter font-semibold text-[0.98rem] text-navy-text" htmlFor={`quiz-${question.id}`}>
                    {question.text}
                  </label>
                  <textarea
                    className="w-full border border-border rounded-[10px] p-[0.7rem_0.85rem] font-mono text-[0.85rem] text-navy-text bg-white resize-y min-h-[90px] focus:outline-none focus:border-blue-bright focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
                    id={`quiz-${question.id}`}
                    maxLength={MAX_CHARS}
                    onChange={(event) => handleChange(question.id, event.target.value)}
                    placeholder="Your answer…"
                    rows={4}
                    value={value}
                  />
                  <div className="flex justify-between gap-[0.75rem] text-[0.72rem] text-muted">
                    <span className="flex-1">{question.hint}</span>
                    <span className="flex-shrink-0">
                      {value.length} / {MAX_CHARS}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          {error ? <div className="text-[0.74rem] text-[#b42318]">{error}</div> : null}
        </div>

        <div className="flex justify-end gap-[0.5rem] p-[1rem_1.5rem] border-t border-border bg-[#f8fafc]">
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
