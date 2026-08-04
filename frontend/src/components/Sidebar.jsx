function Sidebar({ email, conversations, activeId, loading, onSelect, onNew, onDelete, onLogout }) {
  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (window.confirm('Delete this conversation?')) {
      onDelete(id)
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="auth-emoji" aria-hidden="true">🐍</span>
        <div>
          <h2>PyTutor</h2>
          <p className="sidebar-tagline">Encouraging. Patient. Step-by-step.</p>
        </div>
      </div>

      <button type="button" className="new-chat-btn" onClick={onNew}>
        + New conversation
      </button>

      <div className="conversation-list">
        {loading && <p className="sidebar-hint">Loading…</p>}
        {!loading && conversations.length === 0 && (
          <p className="sidebar-hint">No conversations yet. Ask your first Python question!</p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`conversation-item ${conv.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(conv.id)}
          >
            <span className="conversation-title">{conv.title}</span>
            <button
              type="button"
              className="conversation-delete"
              onClick={(e) => handleDelete(e, conv.id)}
              aria-label="Delete conversation"
              title="Delete conversation"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <span className="sidebar-email" title={email}>{email}</span>
        <button type="button" className="logout-btn" onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
