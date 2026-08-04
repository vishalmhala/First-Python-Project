import { useCallback, useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import ChatWindow from './ChatWindow'
import * as api from '../api'
import './Chat.css'

function ChatLayout({ auth, onLogout }) {
  const [conversations, setConversations] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const refreshConversations = useCallback(async () => {
    try {
      const data = await api.getConversations(auth.userId)
      setConversations(data.conversations || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingConversations(false)
    }
  }, [auth.userId])

  useEffect(() => {
    // Initial fetch on mount; setState happens after the awaited request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshConversations()
  }, [refreshConversations])

  const openConversation = useCallback(async (id) => {
    setConversationId(id)
    setLoadingMessages(true)
    setError('')
    try {
      const data = await api.getConversation(id)
      setMessages(data.messages || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  const startNewConversation = () => {
    setConversationId(null)
    setMessages([])
    setError('')
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteConversation(id)
      if (id === conversationId) startNewConversation()
      refreshConversations()
    } catch (err) {
      setError(err.message)
    }
  }

  const sendMessage = async (text) => {
    setSending(true)
    setError('')
    setMessages((prev) => [...prev, { role: 'user', text, pending: true }])
    try {
      const data = await api.askAgent({
        message: text,
        token: auth.token,
        conversationId,
      })
      const isNewConversation = !conversationId
      setMessages((prev) => [
        ...prev.filter((m) => !m.pending),
        { role: 'user', text },
        { role: 'agent', text: data.response, confidence: data.confidence },
      ])
      if (isNewConversation) {
        setConversationId(data.conversation_id)
        refreshConversations()
      }
    } catch (err) {
      setError(err.message)
      setMessages((prev) => prev.filter((m) => !m.pending))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="chat-layout">
      <Sidebar
        email={auth.email}
        conversations={conversations}
        activeId={conversationId}
        loading={loadingConversations}
        onSelect={openConversation}
        onNew={startNewConversation}
        onDelete={handleDelete}
        onLogout={onLogout}
      />
      <ChatWindow
        messages={messages}
        loading={loadingMessages}
        sending={sending}
        error={error}
        isNew={!conversationId}
        onSend={sendMessage}
      />
    </div>
  )
}

export default ChatLayout
