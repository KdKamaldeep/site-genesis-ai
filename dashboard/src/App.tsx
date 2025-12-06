import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { MainLayout } from './components/layout/main-layout'
import LoginPage from './pages/LoginPage'
import TenantsPage from './pages/TenantsPage'
import TenantDetailPage from './pages/TenantDetailPage'
import KeywordsPage from './pages/KeywordsPage'
import ContentPage from './pages/ContentPage'
import TemplatesPage from './pages/TemplatesPage'
import SchedulerPage from './pages/SchedulerPage'
import SettingsPage from './pages/SettingsPage'

// Protected Route Component
function ProtectedRoute() {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/tenants" replace />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/tenants/:id" element={<TenantDetailPage />} />
        <Route path="/keywords" element={<KeywordsPage />} />
        <Route path="/content" element={<ContentPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/scheduler" element={<SchedulerPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App

