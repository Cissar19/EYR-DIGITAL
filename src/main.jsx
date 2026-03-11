import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Import Providers (STRICT LIST)
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { AdministrativeDaysProvider } from './context/AdministrativeDaysContext.jsx'
import { LabProvider } from './context/LabContext.jsx'
import { PrintProvider } from './context/PrintContext.jsx'
import { TicketProvider } from './context/TicketContext.jsx'
import { EquipmentProvider } from './context/EquipmentContext.jsx'
import { ScheduleProvider } from './context/ScheduleContext.jsx'
import { MedicalLeavesProvider } from './context/MedicalLeavesContext.jsx'
import { ReplacementLogsProvider } from './context/ReplacementLogsContext.jsx'

// Gate data providers behind auth so Firestore subscriptions
// only start once the user is authenticated (avoids silent failures
// on cold start when security rules reject unauthenticated reads).
const DataProviders = ({ children }) => {
  const { user, loading } = useAuth();

  // While auth is resolving or user is not logged in, render App
  // without data providers — ProtectedLayout will show loading/login.
  if (loading || !user) return children;

  return (
    <AdministrativeDaysProvider>
      <LabProvider>
        <PrintProvider>
          <TicketProvider>
            <EquipmentProvider>
              <ScheduleProvider>
                <MedicalLeavesProvider>
                  <ReplacementLogsProvider>
                    {children}
                  </ReplacementLogsProvider>
                </MedicalLeavesProvider>
              </ScheduleProvider>
            </EquipmentProvider>
          </TicketProvider>
        </PrintProvider>
      </LabProvider>
    </AdministrativeDaysProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <DataProviders>
          <App />
        </DataProviders>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
