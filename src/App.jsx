import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./controllers/AuthController";
import { ReportsProvider } from "./controllers/ReportsController";
import { ThemeProvider } from "./controllers/ThemeController";
import { ToastProvider } from "./controllers/ToastController";
import Header from "./components/Header/Header";
import AdminSidebar from "./components/AdminSidebar/AdminSidebar";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Home from "./pages/Home/Home";
import CreateReport from "./pages/CreateReport/CreateReport";
import ReportDetail from "./pages/ReportDetail/ReportDetail";
import EditReport from "./pages/EditReport/EditReport";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile/Profile";
import Admin from "./pages/Admin/Admin";
import PanelEmpleado from "./pages/PanelEmpleado/PanelEmpleado";

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function EmpleadoRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "empleado") return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <>
      {currentUser && <Header />}
      {currentUser && <AdminSidebar />}
      <Routes>
        <Route path="/login"    element={currentUser ? <Navigate to={currentUser.role === 'admin' ? '/dashboard' : currentUser.role === 'empleado' ? '/mi-panel' : '/'} replace /> : <Login />} />
        <Route path="/registro" element={currentUser ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/"            element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/crear"       element={<ProtectedRoute><CreateReport /></ProtectedRoute>} />
        <Route path="/reporte/:id" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />
        <Route path="/editar/:id"  element={<ProtectedRoute><EditReport /></ProtectedRoute>} />
        <Route path="/dashboard"   element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/perfil"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin"       element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/mi-panel"    element={<EmpleadoRoute><PanelEmpleado /></EmpleadoRoute>} />
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
