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
import Marketplace from './components/Marketplace'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [userRole, setUserRole] = useState('loading') // 'teacher' | 'student' | 'loading'
  const [userAvatarUrl, setUserAvatarUrl] = useState(null)

  useEffect(() => {
    // 0. Immediate Theme Check (Local Storage)
    const localTheme = localStorage.getItem('theme');
    const root = document.documentElement;

    // Default to Dark if null, or if explicitly Dark
    if (localTheme === 'Dark' || !localTheme) {
      root.classList.add('dark');
      if (!localTheme) localStorage.setItem('theme', 'Dark'); // Set default
    } else if (localTheme === 'Light') {
      root.classList.remove('dark');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        checkUserRole(session.user.id)
        checkTheme(session.user.id)
        fetchUserProfile(session.user.id)
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
        checkTheme(session.user.id)
        fetchUserProfile(session.user.id)
      } else {
        setUserRole('teacher')
        setUserAvatarUrl(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single()

      if (data) {
        setUserAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const checkTheme = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('theme')
        .eq('id', userId)
        .single()

      const root = document.documentElement;
      if (data?.theme === 'Dark') {
        root.classList.add('dark')
      } else if (data?.theme === 'Light') {
        root.classList.remove('dark')
      } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    } catch (error) {
      console.error('Error checking theme:', error)
    }
  }

  const checkUserRole = async (userId) => {
    try {
      // Check if this user is linked to a student record
      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle()

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

  // 2. No Session -> Landing Page / Login / Marketplace
  if (!session) {
    if (showLogin) {
      return <Login onBackToHome={() => setShowLogin(false)} />
    }
    // We need to handle routing here for public pages if we want /search to work without login
    // But currently App structure returns early.
    // Let's wrap the public view in a Router to allow /search access.

    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage onSignInClick={() => setShowLogin(true)} />} />
          <Route path="/search" element={<Marketplace />} />
          <Route path="*" element={<LandingPage onSignInClick={() => setShowLogin(true)} />} />
        </Routes>
      </BrowserRouter>
    )
  }

  // 3. Student View
  if (userRole === 'student') {
    return <StudentDashboard session={session} />
  }

  // 4. Teacher View (Standard Layout)
  return (
    <BrowserRouter>
      <Layout userAvatarUrl={userAvatarUrl}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/settings" element={<Settings onAvatarUpdate={setUserAvatarUrl} />} />
          {/* Allow teachers to view marketplace too? Maybe not needed in layout but useful */}
          <Route path="/search" element={<Marketplace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
