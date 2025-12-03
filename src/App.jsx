import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Students from './components/Students'
import Calendar from './components/Calendar'
import Billing from './components/Billing'
import Settings from './components/Settings'
import Login from './components/Login'
import LandingPage from './components/LandingPage'
import StudentDashboard from './components/StudentDashboard'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [userRole, setUserRole] = useState('loading') // 'teacher' | 'student' | 'loading'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        checkUserRole(session.user.id)
      } else {
        setUserRole('teacher') // Or null, but we want to stop loading
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        setUserRole('loading')
        checkUserRole(session.user.id)
      } else {
        setUserRole('teacher')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUserRole = async (userId) => {
    try {
      // Check if this user is linked to a student record
      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('auth_user_id', userId)
        .single()

      if (data) {
        setUserRole('student')
      } else {
        setUserRole('teacher')
      }
    } catch (error) {
      console.error('Error checking role:', error)
      setUserRole('teacher')
    }
  }

  // 1. Loading State
  if (userRole === 'loading') {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>
  }

  // 2. No Session -> Landing Page / Login
  if (!session) {
    if (showLogin) {
      return <Login onBackToHome={() => setShowLogin(false)} />
    }
    return <LandingPage onSignInClick={() => setShowLogin(true)} />
  }

  // 3. Student View
  if (userRole === 'student') {
    return <StudentDashboard session={session} />
  }

  // 4. Teacher View (Standard Layout)
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
