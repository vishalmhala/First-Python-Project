const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function request(path, { method = 'GET', params = {} } = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  }
  const qs = query.toString()
  const url = `${API_BASE}${path}${qs ? `?${qs}` : ''}`

  const res = await fetch(url, { method })
  let data = {}
  try {
    data = await res.json()
  } catch {
    // no JSON body
  }

  if (!res.ok || data.status === 'error' || data.error) {
    throw new Error(data.error || data.detail || `Request failed (${res.status})`)
  }
  return data
}

export function signup(email, password) {
  return request('/api/auth/signup', { method: 'POST', params: { email, password } })
}

export function login(email, password) {
  return request('/api/auth/login', { method: 'POST', params: { email, password } })
}

export function askAgent({ message, token, conversationId }) {
  return request('/api/ask', {
    method: 'POST',
    params: { message, token, conversation_id: conversationId },
  })
}

export function getConversations(userId) {
  return request('/api/conversations', { params: { user_id: userId } })
}

export function getConversation(conversationId) {
  return request(`/api/conversations/${conversationId}`)
}

export function deleteConversation(conversationId) {
  return request(`/api/conversations/${conversationId}`, { method: 'DELETE' })
}
