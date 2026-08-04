import { useEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble'

const SUGGESTIONS = [
  'How do list comprehensions work?',
  'Why am I getting an IndentationError?',
  'Explain Python decorators with an example',
  "What's the difference between a list and a tuple?",
]

function ChatWindow({ messages, loading, sending, error, isNew, onSend }) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const submit = () => {
    const text = draft.trim()
    if (!text || sending) return
    setDraft('')
    onSend(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const showEmptyState = isNew && messages.length === 0 && !loading

  return (
    <main className="chat-window">
      <div className="chat-scroll" ref={scrollRef}>
        {loading && <p className="sidebar-hint">Loading conversation…</p>}

        {showEmptyState && (
          <div className="empty-state">
            <span className="auth-emoji" aria-hidden="true">🐍</span>
            <h3>Hi, I'm PyTutor</h3>
            <p>
              I'm an expert Python tutor. Ask me anything — I'll explain concepts
              step by step, share working code examples, and tell you the &ldquo;why&rdquo;,
              not just the &ldquo;what&rdquo;.
            </p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button type="button" key={s} onClick={() => onSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.text} confidence={m.confidence} pending={m.pending} />
        ))}
      </div>

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-input-bar">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a Python question… (Shift+Enter for a new line)"
          rows={1}
          disabled={sending}
        />
        <button type="button" onClick={submit} disabled={sending || !draft.trim()}>
          {sending ? 'Thinking…' : 'Send'}
        </button>
      </div>
    </main>
  )
}

export default ChatWindow
