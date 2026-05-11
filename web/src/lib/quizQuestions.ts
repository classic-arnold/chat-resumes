export type QuizQuestionId =
  | 'identity'
  | 'impact'
  | 'superpower'
  | 'direction'
  | 'closer'

export type QuizQuestion = {
  category: string
  hint: string
  id: QuizQuestionId
  number: string
  text: string
}

export const quizQuestions: QuizQuestion[] = [
  {
    category: 'Identity',
    hint:
      "This becomes the core of your AI's personality. Be real, be human — this is your headline pitch that no bullet point can replace.",
    id: 'identity',
    number: 'Question 01',
    text: "If a recruiter had 60 seconds with you, what would you want them to walk away knowing — that your resume simply can't convey?",
  },
  {
    category: 'Impact',
    hint:
      'Not just the metric — the meaning. Recruiters remember stories, not spreadsheets. Your AI will tell this compellingly on your behalf.',
    id: 'impact',
    number: 'Question 02',
    text: "What's the single most meaningful thing you've achieved in your career, and why did it matter to you?",
  },
  {
    category: 'Superpower',
    hint:
      "Your hidden edge — the skill that isn't obvious on paper. This is what sets you apart from candidates with identical CVs.",
    id: 'superpower',
    number: 'Question 03',
    text: 'What do colleagues consistently come to you for that surprises people when they first find out?',
  },
  {
    category: 'Direction',
    hint:
      'Recruiters use this to qualify you for the right roles instantly. Be specific — vague answers train vague AI.',
    id: 'direction',
    number: 'Question 04',
    text: 'What does your ideal next role look like, and what kind of team culture makes you do your best work?',
  },
  {
    category: 'Closer',
    hint:
      "Your mic-drop moment. The thing you've always wanted a chance to say. Your AI will deploy this at exactly the right moment.",
    id: 'closer',
    number: 'Question 05',
    text: "What's one question you wish every recruiter would ask you — and what's your answer?",
  },
]

export const QUIZ_QUESTION_IDS: QuizQuestionId[] = quizQuestions.map((q) => q.id)
export const QUIZ_TOTAL = quizQuestions.length
