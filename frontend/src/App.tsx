import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PasswordReset from './pages/PasswordReset';
import Organizations from './pages/Organizations';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Containers from './pages/Containers';
import ContainerConfiguration from './pages/ContainerConfiguration';
import Nodes from './pages/Nodes';
import Deployments from './pages/Deployments';
import Templates from './pages/Templates';
import Settings from './pages/Settings';

// Components
import PrivateRoute from './components/PrivateRoute';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            
            {/* Protected routes */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/organizations" element={<PrivateRoute><Organizations /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
            <Route path="/projects/:projectId" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
            <Route path="/project/:projectId/environment/:containerId" element={<PrivateRoute><ContainerConfiguration /></PrivateRoute>} />
            <Route path="/containers" element={<PrivateRoute><Containers /></PrivateRoute>} />
            <Route path="/nodes" element={<PrivateRoute><Nodes /></PrivateRoute>} />
            <Route path="/deployments" element={<PrivateRoute><Deployments /></PrivateRoute>} />
            <Route path="/templates" element={<PrivateRoute><Templates /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
