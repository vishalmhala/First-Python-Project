import { renderFormattedText } from '../utils/formatMessage'

function MessageBubble({ role, text, confidence, pending }) {
  const isAgent = role === 'agent'

  return (
    <div className={`message-row ${isAgent ? 'agent' : 'user'}`}>
      <div className="message-avatar" aria-hidden="true">{isAgent ? '🐍' : '🙂'}</div>
      <div className="message-bubble">
        <div className="message-meta">
          <span className="message-role">{isAgent ? 'PyTutor' : 'You'}</span>
          {isAgent && typeof confidence === 'number' && (
            <span className="message-confidence">{confidence}% confident</span>
          )}
        </div>
        <div className="message-text">
          {pending ? <span className="typing-dots">●●●</span> : renderFormattedText(text)}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
