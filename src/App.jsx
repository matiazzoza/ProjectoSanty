import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ReportsProvider } from "./context/ReportsContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import Header from "./components/Header/Header";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import CreateReport from "./pages/CreateReport/CreateReport";
import ReportDetail from "./pages/ReportDetail/ReportDetail";
import EditReport from "./pages/EditReport/EditReport";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile/Profile";
import Admin from "./pages/Admin/Admin";

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <>
      {currentUser && <Header />}
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/"            element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/crear"       element={<ProtectedRoute><CreateReport /></ProtectedRoute>} />
        <Route path="/reporte/:id" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />
        <Route path="/editar/:id"  element={<ProtectedRoute><EditReport /></ProtectedRoute>} />
        <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/perfil"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin"       element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ReportsProvider>
              <AppRoutes />
            </ReportsProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
