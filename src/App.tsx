import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuthStore } from './stores/useAuthStore'
import { useProjectStore } from './stores/useProjectStore'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ProjectDetail from './pages/ProjectDetail'
import ProjectList from './pages/ProjectList'
import Sidebar from './components/layout/Sidebar'
import PageWrapper from './components/layout/PageWrapper'
import Toast from './components/ui/Toast'

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export default function App() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const initProjects = useProjectStore((state) => state.initProjects)
  const navigate = useNavigate()
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    initProjects()
  }, [initProjects])

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const showToast = (message: string, type: ToastItem['type'] = 'info') => {
    setToasts((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const layout = useMemo(
    () => (
      <div className="min-h-screen bg-slate-50">
        <div className="lg:flex">
          {user ? <Sidebar user={user} onLogout={logout} /> : null}
          <div className="flex-1">
            <PageWrapper>
              <Routes>
                <Route path="/login" element={<Login onSuccess={(message) => showToast(message, 'success')} />} />
                <Route
                  path="/"
                  element={user ? (user.role === 'manager' ? <Dashboard showToast={showToast} /> : <Navigate to="/projects" />) : <Navigate to="/login" />}
                />
                <Route
                  path="/projects"
                  element={user ? <ProjectList showToast={showToast} /> : <Navigate to="/login" />}
                />
                <Route
                  path="/projects/:projectId"
                  element={user ? <ProjectDetail showToast={showToast} /> : <Navigate to="/login" />}
                />
                <Route path="*" element={<Navigate to={user ? (user.role === 'manager' ? '/' : '/projects') : '/login'} />} />
              </Routes>
            </PageWrapper>
          </div>
        </div>
        <div className="fixed bottom-4 right-4 flex flex-col gap-3">
          {toasts.map((toast) => (
            <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
          ))}
        </div>
      </div>
    ),
    [logout, showToast, toasts, user]
  )

  return layout
}
