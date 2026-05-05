import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthShellProps = {
  actionLabel: string
  children: ReactNode
  footnote: ReactNode
  heroBody: string
  heroHeadline: string
  heroUrl: ReactNode
  subtitle: ReactNode
  testimonials: Array<{
    name: string
    stars?: string
    text: string
  }>
  title: string
}

export const AuthShell = ({
  actionLabel,
  children,
  footnote,
  heroBody,
  heroHeadline,
  heroUrl,
  subtitle,
  testimonials,
  title,
}: AuthShellProps) => (
  <div className="auth-page">
    <div className="auth-left">
      <div className="auth-left-dots" />
      <div className="auth-left-glow" />
      <div className="auth-left-top">
        <Link className="auth-brand" to="/">
          💬 Chat<em>Resumes</em>
        </Link>
        <div className="auth-pitch">
          <div className="auth-pitch-headline">{heroHeadline}</div>
          <div className="auth-pitch-body">{heroBody}</div>
          <div className="auth-pitch-url">{heroUrl}</div>
        </div>
      </div>
      <div className="auth-testimonials">
        {testimonials.map((testimonial) => (
          <div className="auth-testimonial" key={testimonial.name}>
            <div className="auth-testimonial-stars">
              {testimonial.stars ?? '★★★★★'}
            </div>
            <div className="auth-testimonial-text">{testimonial.text}</div>
            <div className="auth-testimonial-name">{testimonial.name}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="auth-right">
      <div className="route-shell-note">
        Setup shell only. The real auth workflow is intentionally not wired yet.
      </div>
      <div className="auth-right-top">
        <div className="auth-title">{title}</div>
        <div className="auth-subtitle">{subtitle}</div>
      </div>
      <div className="auth-form">
        <button className="btn-google" disabled type="button">
          <span className="google-g">G</span>
          Continue with Google
        </button>
        <div className="divider-row">
          <div className="divider-line" />
          <div className="divider-text">route shell</div>
          <div className="divider-line" />
        </div>
        {children}
        <button className="btn-submit-auth" disabled type="button">
          {actionLabel}
        </button>
      </div>
      <div className="terms-note auth-footnote">{footnote}</div>
    </div>
  </div>
)