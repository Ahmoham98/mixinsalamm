import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import CredentialsPage from './pages/CredentialsPage'
import HomePage from './pages/HomePage'
import BasalamCallback from './pages/BasalamCallback'
import LandingPage from './pages/LandingPage'; // <-- **این خط را اضافه کنید**

const queryClient = new QueryClient()

// PrivateRoute logic remains the same, but the redirect path changes
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  // Redirect to /login if not authenticated, as LandingPage is now at /
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace={true} />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* 1. LandingPage will now be the default route */}
          <Route path="/" element={<LandingPage />} />

          {/* 2. CredentialsPage moved to a new path, e.g., /login */}
          <Route path="/login" element={<CredentialsPage />} />

          {/* Other existing routes */}
          <Route path="/basalam/callback" element={<BasalamCallback />} />

          {/* Protected HomePage route */}
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App