import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import RollList from './pages/RollList'
import RollDetail from './pages/RollDetail'
import DevTimer from './pages/DevTimer'
import Settings from './pages/Settings'
import BottomNav from './components/BottomNav'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="w-full bg-primary min-h-[100dvh] flex justify-center text-text overflow-hidden">
        <div className="w-full max-w-[430px] bg-primary min-h-[100dvh] relative border-x border-border/20 shadow-2xl overflow-y-auto">
          <Routes>
            <Route path="/" element={<RollList />} />
            <Route path="/roll/:id" element={<RollDetail />} />
            <Route path="/timer" element={<DevTimer />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
          <BottomNav />
        </div>
      </div>
    </BrowserRouter>
  )
}
