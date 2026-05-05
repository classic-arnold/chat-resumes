import { Link } from 'react-router-dom'

const activityItems = [
  {
    icon: '💬',
    kind: 'chat',
    summary: 'Chatted for 6 min · asked about leadership & salary',
    time: '2h ago',
    title: 'Sarah M. · TechCorp Recruiting',
  },
  {
    icon: '👁',
    kind: 'view',
    summary: 'Viewed your link · 3 min session',
    time: 'Yesterday',
    title: 'Anonymous Recruiter',
  },
  {
    icon: '💬',
    kind: 'chat',
    summary: 'Chatted for 11 min · very engaged',
    time: '2 days ago',
    title: 'David K. · StartupXYZ',
  },
  {
    icon: '👁',
    kind: 'view',
    summary: 'Viewed your link · 8 min session',
    time: '3 days ago',
    title: 'Priya S. · Google',
  },
]

const miniStats = [
  { label: 'Link Views This Week', value: '12' },
  { label: 'Chat Sessions', value: '4' },
  { label: 'Avg. Chat Duration', value: '6.2m' },
]

const checklistItems = [
  { done: true, icon: '✅', label: 'Created your account' },
  { done: true, icon: '✅', label: 'Claimed your ChatResumes link' },
  {
    done: false,
    icon: '📄',
    label: 'Upload your resume & answer 5 questions',
  },
  {
    done: false,
    icon: '🔗',
    label: 'Add your link to your resume header',
  },
]

export const DashboardPage = () => (
  <div className="dashboard-page">
    <nav className="dash-nav">
      <Link className="logo" to="/">
        <div className="logo-icon">💬</div>
        Chat<span>Resumes</span>
      </Link>
      <div className="dash-user">
        <div>
          <div className="dash-name">Jordan Hayes</div>
          <div className="dash-email">jordan@email.com</div>
        </div>
        <div className="dash-avatar">JH</div>
      </div>
    </nav>

    <div className="dash-content">
      <div className="route-shell-note route-shell-note-dashboard">
        Dashboard shell only. Analytics, recruiter conversations, and profile
        editing are represented visually but not wired yet.
      </div>

      <div className="dash-welcome">
        <h2>Good morning, Jordan 👋</h2>
        <p>Your AI resume is live and has been viewed 12 times this week.</p>
      </div>

      <div className="dash-url-card">
        <div>
          <div className="dash-url-label">Your ChatResumes Link</div>
          <div className="dash-url-value">
            <span>chatresumes.io/</span>
            jordan-hayes
          </div>
        </div>
        <div className="dash-url-actions">
          <button className="btn-copy" disabled type="button">
            📋 Copy Link
          </button>
          <button className="btn-share" disabled type="button">
            ↗ Share
          </button>
          <Link className="btn-share btn-share-dark" to="/">
            ✏️ Edit AI
          </Link>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card-title">
            Recent Recruiter Activity <span className="dash-badge">This Week</span>
          </div>
          {activityItems.map((item) => (
            <div className="activity-item" key={`${item.title}-${item.time}`}>
              <div className={`activity-icon ${item.kind}`}>{item.icon}</div>
              <div>
                <div className="activity-who">{item.title}</div>
                <div className="activity-what">{item.summary}</div>
              </div>
              <div className="activity-when">{item.time}</div>
            </div>
          ))}
        </div>

        <div className="dash-card">
          <div className="dash-card-title">Your Stats</div>
          {miniStats.map((stat) => (
            <div className="stat-mini" key={stat.label}>
              <div className="stat-mini-num">{stat.value}</div>
              <div className="stat-mini-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">
          Complete Your Setup <span className="dash-badge">2 of 4 done</span>
        </div>
        <div className="setup-checklist">
          {checklistItems.map((item) => (
            <div className={`checklist-item${item.done ? ' done' : ''}`} key={item.label}>
              <span className="check-icon">{item.icon}</span>
              <span className={`check-label${item.done ? ' done-text' : ''}`}>
                {item.label}
              </span>
              {item.done ? null : <span className="check-arrow">→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)