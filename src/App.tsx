import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LocaleProvider } from '@/hooks/useTranslation'
import { ThemeProvider } from '@/hooks/useTheme'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/hooks/useToast'
import { ModalProvider } from '@/hooks/useModal'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { RedirectIfAuthenticated } from '@/components/layout/RedirectIfAuthenticated'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { HabitGridPage } from '@/pages/HabitGridPage'
import { ChallengePage } from '@/pages/ChallengePage'
import { WatchlistPage } from '@/pages/WatchlistPage'
import { ProfilePage } from '@/pages/ProfilePage'

function App() {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <ToastProvider>
          <ModalProvider>
            <AuthProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<RedirectIfAuthenticated />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                  </Route>

                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/habit-grid" element={<HabitGridPage />} />
                      <Route path="/challenge" element={<ChallengePage />} />
                      <Route path="/watchlist" element={<WatchlistPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                    </Route>
                  </Route>
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </ModalProvider>
        </ToastProvider>
      </ThemeProvider>
    </LocaleProvider>
  )
}

export default App
