import { requestApi, type TokenProvider } from './api'
import type { CandidateProfile } from './dashboard'
import type { QuizQuestionId } from './quizQuestions'

export type QuizAnswers = Partial<Record<QuizQuestionId, string>>

export const fetchQuiz = (getToken: TokenProvider) => {
  return requestApi<{ answers: QuizAnswers }>('/api/profile/quiz', { getToken })
}

export const saveQuiz = (
  getToken: TokenProvider,
  answers: Partial<Record<QuizQuestionId, string | null>>,
) => {
  return requestApi<{ answers: QuizAnswers; profile: CandidateProfile }>(
    '/api/profile/quiz',
    {
      body: { answers },
      getToken,
      method: 'PUT',
    },
  )
}
