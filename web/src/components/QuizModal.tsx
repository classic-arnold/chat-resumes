import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/react'
import { X, BookOpen, Loader2, AlertCircle } from 'lucide-react'

import { fetchQuiz, saveQuiz, type QuizAnswers } from '../lib/quiz'
import { quizQuestions, QUIZ_TOTAL, type QuizQuestionId } from '../lib/quizQuestions'

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

  const progressPercent = (answeredCount / QUIZ_TOTAL) * 100

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-[1rem] z-[1000] backdrop-blur-[6px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Intake quiz"
    >
      <div className="bg-white rounded-[20px] w-full max-w-[720px] max-h-[85vh] flex flex-col shadow-[0_24px_70px_rgba(15,23,42,0.25)] overflow-hidden border border-slate-100 font-sans">
        
        {/* Modal Header */}
        <div className="relative p-[1.5rem] border-b border-slate-100 flex flex-col gap-[0.75rem]">
          {/* Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#5B54F7] to-blue-bright" />
          
          <div className="flex items-start justify-between gap-[1rem]">
            <div className="flex items-center gap-[0.75rem]">
              <div className="w-[36px] h-[36px] rounded-full bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-[#5B54F7]">
                <BookOpen size={18} />
              </div>
              <div>
                <div className="text-[0.66rem] uppercase tracking-[0.1em] text-[#5B54F7] font-extrabold">Intake Quiz</div>
                <h2 className="font-inter font-extrabold text-[1.2rem] text-[#0f1f4b] m-0 tracking-tight mt-[0.15rem]">
                  The 5 core recruiter questions
                </h2>
              </div>
            </div>
            
            <button
              aria-label="Close"
              className="p-[0.5rem] bg-transparent border-none text-slate-400 hover:text-slate-700 cursor-pointer rounded-full hover:bg-slate-50 transition-colors"
              onClick={onClose}
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          {/* Visual Progress Bar */}
          <div className="mt-[0.25rem]">
            <div className="flex items-center justify-between text-[0.78rem] font-semibold text-slate-500 mb-[0.35rem]">
              <span>Progress</span>
              <span className="text-[#5B54F7]">{answeredCount} of {QUIZ_TOTAL} answered</span>
            </div>
            <div className="w-full h-[6px] bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#5B54F7] to-blue-bright rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Questions List */}
        <div className="p-[1.5rem] overflow-y-auto flex flex-col gap-[1.5rem]">
          {isLoading ? (
            <div className="text-center text-[0.8rem] text-slate-500 py-[4rem] px-[1rem] flex flex-col items-center justify-center gap-[0.75rem]">
              <Loader2 className="w-[28px] h-[28px] text-[#5B54F7] animate-spin" />
              <span className="font-medium">Loading your profile quiz answers...</span>
            </div>
          ) : (
            quizQuestions.map((question, idx) => {
              const value = answers[question.id] ?? ''
              const isAnswered = value.trim().length > 0
              
              return (
                <div 
                  className={`flex flex-col gap-[0.6rem] p-[1.25rem] rounded-[16px] border transition-all ${
                    isAnswered 
                      ? 'border-indigo-100 bg-indigo-50/[0.02]' 
                      : 'border-slate-100 bg-white'
                  }`} 
                  key={question.id}
                >
                  <div className="flex items-center justify-between gap-[0.75rem]">
                    <div className="flex items-center gap-[0.55rem]">
                      <span className="w-[20px] h-[20px] rounded-full bg-[#5B54F7]/10 text-[#5B54F7] flex items-center justify-center text-[0.7rem] font-extrabold">
                        {question.number || idx + 1}
                      </span>
                      <span className="text-[0.66rem] font-bold uppercase tracking-[0.06em] bg-slate-100 text-slate-600 px-[0.55rem] py-[0.15rem] rounded-full">
                        {question.category}
                      </span>
                    </div>
                    {isAnswered && (
                      <span className="text-[0.7rem] font-bold text-emerald-600 flex items-center gap-[0.25rem]">
                        <span className="w-[5px] h-[5px] rounded-full bg-emerald-500" />
                        Completed
                      </span>
                    )}
                  </div>
                  
                  <label 
                    className="font-inter font-bold text-[0.92rem] text-[#0f1f4b] leading-tight" 
                    htmlFor={`quiz-${question.id}`}
                  >
                    {question.text}
                  </label>
                  
                  <textarea
                    className="w-full border border-slate-200 rounded-[12px] p-[0.75rem_1rem] font-sans text-[0.85rem] text-[#0f1f4b] bg-white resize-y min-h-[100px] focus:outline-none focus:border-[#5B54F7] focus:ring-4 focus:ring-indigo-100/50 transition-all placeholder-slate-400"
                    id={`quiz-${question.id}`}
                    maxLength={MAX_CHARS}
                    onChange={(event) => handleChange(question.id, event.target.value)}
                    placeholder="Provide your experience, projects, or background details here..."
                    rows={4}
                    value={value}
                  />
                  
                  <div className="flex items-start justify-between gap-[0.75rem] text-[0.72rem] text-slate-500 mt-[0.1rem]">
                    <span className="leading-[1.4] flex-1">{question.hint}</span>
                    <span className="flex-shrink-0 font-semibold font-mono text-slate-400">
                      {value.length} / {MAX_CHARS}
                    </span>
                  </div>
                </div>
              )
            })
          )}

          {error ? (
            <div className="flex items-center gap-[0.5rem] text-[0.78rem] text-rose-600 bg-rose-50 border border-rose-100 rounded-[12px] p-[1rem]">
              <AlertCircle className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end items-center gap-[0.75rem] p-[1.25rem_1.5rem] border-t border-slate-100 bg-slate-50/50">
          <button 
            onClick={onClose} 
            className="px-[1.25rem] py-[0.6rem] bg-white hover:bg-slate-100 text-slate-700 text-[0.82rem] font-bold rounded-[12px] border border-slate-200 transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button 
            disabled={isSaving || isLoading} 
            onClick={() => void handleSave()} 
            className="inline-flex items-center justify-center gap-[0.5rem] px-[1.5rem] py-[0.6rem] bg-[#5B54F7] hover:bg-[#4a43e6] disabled:opacity-50 text-white text-[0.82rem] font-bold rounded-[12px] transition-all cursor-pointer border-none shadow-[0_4px_12px_rgba(91,84,247,0.15)] active:scale-[0.98]"
          >
            {isSaving && <Loader2 className="w-[14px] h-[14px] animate-spin" />}
            {isSaving ? 'Saving...' : 'Save & close'}
          </button>
        </div>
      </div>
    </div>
  )
}
