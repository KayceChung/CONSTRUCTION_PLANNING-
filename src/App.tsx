import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuthStore } from './stores/useAuthStore'
import { useCustomerStore } from './stores/useCustomerStore'
import { useProjectStore } from './stores/useProjectStore'
import { useStaffStore } from './stores/useStaffStore'
import { useProjectTypeStore } from './stores/useProjectTypeStore'
import { supabase } from './lib/supabase'
import ErrorBoundary from './components/ErrorBoundary'
import CustomerDetail from './pages/CustomerDetail'
import CustomerList from './pages/CustomerList'
import CreateProject from './pages/CreateProject'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ProjectDetail from './pages/ProjectDetail'
import ProjectList from './pages/ProjectList'
import PersonnelDetail from './pages/PersonnelDetail'
import PersonnelList from './pages/PersonnelList'
import Settings from './pages/Settings'
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
  const authLoading = useAuthStore((state) => state.loading)
  const logout = useAuthStore((state) => state.logout)
  const initProjects = useProjectStore((state) => state.initProjects)
  const initCustomers = useCustomerStore((state) => state.initCustomers)
  const initStaff = useStaffStore((state) => state.initStaff)
  const initProjectTypes = useProjectTypeStore((state) => state.initProjectTypes)
  const navigate = useNavigate()
  const location = useLocation()
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Đảm bảo luôn khởi tạo trạng thái user khi app khởi động (gọi trong hook)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    void useAuthStore.getState().initialize().then((cleanup) => {
      unsubscribe = cleanup
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  // Test Supabase connection on app start
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔄 Testing Supabase connection...')
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('❌ Supabase connection error:', error)
        } else {
          console.log('✅ Supabase connection successful!')
        }
      } catch (err) {
        console.error('❌ Connection test failed:', err)
      }
    }

    testConnection()
  }, [])

  useEffect(() => {
    if (authLoading || !user) {
      return
    }

    void initProjects()
    void initCustomers()
    void initStaff()
    void initProjectTypes()
  }, [authLoading, initProjects, initCustomers, initStaff, initProjectTypes, user])

  useEffect(() => {
    const publicPaths = ['/login', '/signup', '/forgot-password']

    if (authLoading) {
      return
    }

    if (
      !user &&
      !publicPaths.includes(location.pathname)
    ) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate, location.pathname])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  const showToast = (message: string, type: ToastItem['type'] = 'info') => {
    setToasts((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const layout = useMemo(
    () => {
      // Show loading state while checking auth
      if (authLoading) {
        return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Đang tải...</p>
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-screen bg-slate-50">
          <div className="lg:flex">
            {user ? (
              <>
                <div
                  className={`fixed inset-0 z-40 bg-slate-900/30 transition-opacity lg:hidden ${mobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0'}`}
                  onClick={() => setMobileSidebarOpen(false)}
                />
                <Sidebar
                  user={user}
                  onLogout={logout}
                  mobileOpen={mobileSidebarOpen}
                  onCloseMobile={() => setMobileSidebarOpen(false)}
                />
              </>
            ) : null}
            <div className="flex-1">
              {user ? (
                <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
                      onClick={() => setMobileSidebarOpen(true)}
                      aria-label="Mở menu"
                    >
                      <Menu size={18} />
                    </button>
                    <p className="text-base font-semibold text-slate-900">ConstructTrack</p>
                    <div className="h-10 w-10" />
                  </div>
                </div>
              ) : null}
              <PageWrapper>
                <ErrorBoundary>
                  <Routes>
                  <Route path="/login" element={<Login onSuccess={(message) => showToast(message, 'success')} />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route
                    path="/"
                    element={user ? (user.role === 'manager' ? <Dashboard showToast={showToast} /> : <Navigate to="/projects" />) : <Navigate to="/login" />}
                  />
                  <Route
                    path="/projects"
                    element={user ? <ProjectList showToast={showToast} /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/projects/new"
                    element={user ? (user.role === 'manager' ? <CreateProject showToast={showToast} /> : <Navigate to="/projects" />) : <Navigate to="/login" />}
                  />
                  <Route
                    path="/projects/:projectId"
                    element={user ? <ProjectDetail showToast={showToast} /> : <Navigate to="/login" />}
                  />
                  <Route
                    path="/personnel"
                    element={user ? (user.role === 'manager' ? <PersonnelList showToast={showToast} /> : <Navigate to="/projects" />) : <Navigate to="/login" />}
                  />
                  <Route
                    path="/personnel/:personnelId"
                    element={user ? (user.role === 'manager' ? <PersonnelDetail showToast={showToast} /> : <Navigate to="/projects" />) : <Navigate to="/login" />}
                  />
                  <Route
                    path="/customers"
                    element={user ? (user.role === 'manager' ? <CustomerList showToast={showToast} /> : <Navigate to="/projects" />) : <Navigate to="/login" />}
                  />
                  <Route
                    path="/customers/:customerId"
                    element={user ? (user.role === 'manager' ? <CustomerDetail showToast={showToast} /> : <Navigate to="/projects" />) : <Navigate to="/login" />}
                  />
                  <Route
                    path="/settings"
                    element={user ? (user.role === 'manager' ? <Settings showToast={showToast} /> : <Navigate to="/projects" />) : <Navigate to="/login" />}
                  />
                  <Route path="*" element={<Navigate to={user ? (user.role === 'manager' ? '/' : '/projects') : '/login'} />} />
                </Routes>
                </ErrorBoundary>
              </PageWrapper>
            </div>
          </div>
          <div className="fixed bottom-4 right-4 flex flex-col gap-3">
            {toasts.map((toast) => (
              <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
            ))}
          </div>
        </div>
      )
    },
    [authLoading, logout, showToast, toasts, user]
  )

  return layout
}
