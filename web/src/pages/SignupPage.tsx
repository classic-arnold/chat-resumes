import { Link } from 'react-router-dom'

import { AuthShell } from '../components/AuthShell'

export const SignupPage = () => (
  <AuthShell
    actionLabel="Create My Account & Get My Link →"
    footnote={
      <>
        The final signup flow, billing, and onboarding sequence are not wired
        in this setup yet. The landing page is the only fully implemented
        experience.
      </>
    }
    heroBody="Every candidate on ChatResumes gets a permanent, shareable AI link. Put it on your resume. Recruiters who click it spend an average of 4 minutes learning about you — vs. 7 seconds skimming a PDF."
    heroHeadline='"I got 3 interview requests the week I added my link."'
    heroUrl={
      <>
        🔗 Your link will be: <strong>chatresumes.io/[yourhandle]</strong>
      </>
    }
    subtitle={
      <>
        Already have an account? <Link to="/login">Log in here</Link>
      </>
    }
    testimonials={[
      {
        name: '— Marcus T., Software Engineer at Stripe',
        text: '"I went from ghosted to getting callbacks in 48 hours. The recruiter said my link was what made her stop scrolling."',
      },
      {
        name: '— Priya S., Senior Recruiter at Google',
        text: '"Every serious candidate I am seeing now has one. If yours does not, I am already moving on."',
      },
    ]}
    title="Create your account"
  >
    <div className="auth-row">
      <div className="form-group">
        <label className="form-label">First Name</label>
        <input className="form-input" disabled placeholder="Jordan" type="text" />
      </div>
      <div className="form-group">
        <label className="form-label">Last Name</label>
        <input className="form-input" disabled placeholder="Hayes" type="text" />
      </div>
    </div>

    <div className="form-group">
      <label className="form-label">Email Address</label>
      <input
        className="form-input"
        disabled
        placeholder="jordan@email.com"
        type="email"
      />
    </div>

    <div className="form-group">
      <label className="form-label">Your ChatResumes Handle</label>
      <div className="handle-wrap">
        <span className="handle-prefix">chatresumes.io/</span>
        <input
          className="form-input"
          disabled
          placeholder="jordan-hayes"
          type="text"
        />
      </div>
      <div className="handle-preview">
        🔗 Your link: <span className="preview-url">chatresumes.io/jordan-hayes</span>
      </div>
      <div className="form-hint">
        Lowercase letters, numbers, hyphens only. Permanent — choose wisely.
      </div>
    </div>

    <div className="form-group">
      <label className="form-label">Password</label>
      <input
        className="form-input"
        disabled
        placeholder="Min. 8 characters"
        type="password"
      />
    </div>

    <div className="form-group">
      <label className="form-label">Choose Your Plan</label>
      <div className="plan-cards">
        <div className="plan-card selected">
          <div className="plan-card-name">Starter</div>
          <div className="plan-card-price">
            Free <span>forever</span>
          </div>
          <div className="plan-features">
            <div className="plan-feature">1 AI resume link</div>
            <div className="plan-feature">50 chats/month</div>
            <div className="plan-feature">Basic analytics</div>
          </div>
        </div>
        <div className="plan-card">
          <div className="plan-badge">Popular</div>
          <div className="plan-card-name">Pro</div>
          <div className="plan-card-price">
            $9 <span>/month</span>
          </div>
          <div className="plan-features">
            <div className="plan-feature">Unlimited chats</div>
            <div className="plan-feature">Full analytics</div>
            <div className="plan-feature">Custom branding</div>
          </div>
        </div>
      </div>
    </div>
  </AuthShell>
)