import { Link } from 'react-router-dom'

import { AuthShell } from '../components/AuthShell'

export const LoginPage = () => (
  <AuthShell
    actionLabel="Log In to My Account →"
    footnote={
      <>
        This shell preserves the login surface and brand direction, but the
        actual session flow is not implemented yet.
      </>
    }
    heroBody="While you were gone, your ChatResumes link was out there — answering questions, making impressions, and keeping you in the running for roles you do not even know about yet."
    heroHeadline="Welcome back. Your AI never stopped working."
    heroUrl={
      <>
        🔗 <strong>chatresumes.io/[yourhandle]</strong> — always on
      </>
    }
    subtitle={
      <>
        No account yet? <Link to="/signup">Sign up free →</Link>
      </>
    }
    testimonials={[
      {
        name: '— Alexis R., Product Manager',
        text: '"A recruiter reached out on a Sunday night because they had chatted with my AI at 11pm. No static resume does that."',
      },
    ]}
    title="Welcome back"
  >
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
      <label className="form-label">Password</label>
      <input
        className="form-input"
        disabled
        placeholder="Your password"
        type="password"
      />
      <div className="form-hint form-hint-right">
        <span>Forgot password?</span>
      </div>
    </div>
  </AuthShell>
)