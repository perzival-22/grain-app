import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import RollList from './pages/RollList'
import RollDetail from './pages/RollDetail'
import DevTimer from './pages/DevTimer'
import Settings from './pages/Settings'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import BottomNav from './components/BottomNav'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Spinner() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-primary">
      <div className="w-10 h-10 rounded-full border-2 border-border border-t-accent animate-spin" />
    </div>
  )
}

function AppShell() {
  const { session, loading } = useAuth()
  const onboarded = localStorage.getItem('grain_onboarded') === 'true'

  if (loading) return <Spinner />
  if (!onboarded) return <Onboarding />
  if (!session) return <Auth />

  return (
    <>
      <Routes>
        <Route path="/" element={<RollList />} />
        <Route path="/roll/:id" element={<RollDetail />} />
        <Route path="/timer" element={<DevTimer />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="/onboarding" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="w-full bg-primary min-h-[100dvh] flex justify-center text-text overflow-hidden">
        <div className="w-full max-w-[430px] bg-primary min-h-[100dvh] relative border-x border-border/20 shadow-2xl overflow-y-auto">
          <AppShell />
        </div>
      </div>
    </BrowserRouter>
  )
}
