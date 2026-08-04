import { useEffect, useState } from 'react'
import AuthForm from './components/AuthForm'
import ChatLayout from './components/ChatLayout'

const STORAGE_KEY = 'pytutor_auth'

function App() {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [auth])

  if (!auth) {
    return <AuthForm onAuthenticated={setAuth} />
  }

  return <ChatLayout auth={auth} onLogout={() => setAuth(null)} />
}

export default App
