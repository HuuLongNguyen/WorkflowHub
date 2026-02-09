import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PortalLayout from './components/PortalLayout';
import HomePage from './pages/HomePage';
import NewRequestPage from './pages/NewRequestPage';
import TaskDetailPage from './pages/TaskDetailPage';
import MyRequestsPage from './pages/MyRequestsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PortalLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/new-request/:formId" element={<NewRequestPage />} />
          <Route path="/task/:taskId" element={<TaskDetailPage />} />
          <Route path="/my-requests" element={<MyRequestsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
