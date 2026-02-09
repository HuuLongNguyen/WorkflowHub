
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

import MainLayout from './components/Layout/MainLayout';

// Pages
import DashboardPage from './pages/DashboardPage';
import DirectoryPage from './pages/DirectoryPage';
import ProcessListPage from './pages/processes/ProcessListPage';
import ProcessBuilderPage from './pages/processes/ProcessBuilderPage';
import FormListPage from './pages/forms/FormListPage';
import FormBuilderPage from './pages/forms/FormBuilderPage';
import TaskListPage from './pages/tasks/TaskListPage';
import TaskDetailsPage from './pages/tasks/TaskDetailsPage';
import PreviewPage from './pages/PreviewPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/directory" element={<DirectoryPage />} />

            <Route path="/processes" element={<ProcessListPage />} />
            <Route path="/processes/:id" element={<ProcessBuilderPage />} />

            <Route path="/forms" element={<FormListPage />} />
            <Route path="/forms/:id" element={<FormBuilderPage />} />

            <Route path="/preview/:formId" element={<PreviewPage />} />

            <Route path="/tasks" element={<TaskListPage />} />
            <Route path="/tasks/:id" element={<TaskDetailsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
