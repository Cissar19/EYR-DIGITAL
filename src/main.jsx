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
import { ConvivenciaProvider } from './context/ConvivenciaContext.jsx'
import { StudentsProvider } from './context/StudentsContext.jsx'
import { IncidentsProvider } from './context/IncidentsContext.jsx'
import { PermissionsProvider } from './context/PermissionsContext.jsx'
import { JustificativesProvider } from './context/JustificativesContext.jsx'
import { EntrevistasProvider } from './context/EntrevistasContext.jsx'
import { EvaluacionesProvider } from './context/EvaluacionesContext.jsx'
import { QuestionBankProvider } from './context/QuestionBankContext.jsx'
import { RetosProvider } from './context/RetosContext.jsx'
import { TasksProvider } from './context/TasksContext.jsx'
import { WorkshopsProvider } from './context/WorkshopsContext.jsx'
import { TodoProvider } from './context/TodoContext.jsx'
import { AcademicYearProvider } from './context/AcademicYearContext.jsx'
import { IncentivoEYRProvider } from './context/IncentivoEYRContext.jsx'
import { HolidaysProvider } from './context/HolidaysContext.jsx'

// Gate data providers behind auth so Firestore subscriptions
// only start once the user is authenticated (avoids silent failures
// on cold start when security rules reject unauthenticated reads).
const DataProviders = ({ children }) => {
  const { user, loading } = useAuth();

  // While auth is resolving or user is not logged in, render App
  // without data providers — ProtectedLayout will show loading/login.
  if (loading || !user) return children;

  return (
    <AcademicYearProvider>
      <PermissionsProvider>
        <AdministrativeDaysProvider>
        <LabProvider>
          <PrintProvider>
            <TicketProvider>
              <EquipmentProvider>
                <ScheduleProvider>
                  <MedicalLeavesProvider>
                    <ReplacementLogsProvider>
                      <ConvivenciaProvider>
                        <StudentsProvider>
                          <IncidentsProvider>
                            <JustificativesProvider>
                              <EntrevistasProvider>
                                <EvaluacionesProvider>
                                  <QuestionBankProvider>
                                    <RetosProvider>
                                      <TasksProvider>
                                        <WorkshopsProvider>
                                          <TodoProvider>
                                            <IncentivoEYRProvider>
                                              <HolidaysProvider>
                                                {children}
                                              </HolidaysProvider>
                                            </IncentivoEYRProvider>
                                          </TodoProvider>
                                        </WorkshopsProvider>
                                      </TasksProvider>
                                    </RetosProvider>
                                  </QuestionBankProvider>
                                </EvaluacionesProvider>
                              </EntrevistasProvider>
                            </JustificativesProvider>
                          </IncidentsProvider>
                        </StudentsProvider>
                      </ConvivenciaProvider>
                    </ReplacementLogsProvider>
                  </MedicalLeavesProvider>
                </ScheduleProvider>
              </EquipmentProvider>
            </TicketProvider>
          </PrintProvider>
        </LabProvider>
      </AdministrativeDaysProvider>
    </PermissionsProvider>
    </AcademicYearProvider>
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
