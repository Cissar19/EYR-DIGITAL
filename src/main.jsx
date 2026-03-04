import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Import Providers (STRICT LIST)
import { AuthProvider } from './context/AuthContext.jsx'
import { AdministrativeDaysProvider } from './context/AdministrativeDaysContext.jsx'
import { LabProvider } from './context/LabContext.jsx'
import { PrintProvider } from './context/PrintContext.jsx'
import { TicketProvider } from './context/TicketContext.jsx'
import { EquipmentProvider } from './context/EquipmentContext.jsx'
import { ScheduleProvider } from './context/ScheduleContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AdministrativeDaysProvider>
          <LabProvider>
            <PrintProvider>
              <TicketProvider>
                <EquipmentProvider>
                  <ScheduleProvider>
                    <App />
                  </ScheduleProvider>
                </EquipmentProvider>
              </TicketProvider>
            </PrintProvider>
          </LabProvider>
        </AdministrativeDaysProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
