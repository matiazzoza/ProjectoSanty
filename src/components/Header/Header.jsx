import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import "./Header.scss";

export default function Header() {
  const { currentUser, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isAdmin = currentUser?.id === "u1";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__brand">
          <span className="header__brand-icon">🏙️</span>
          <span className="header__brand-name">ReportaMuni</span>
        </Link>

        {currentUser && (
          <nav className="header__nav">
            {isAdmin && (
              <Link to="/admin" className="header__btn header__btn--ghost header__btn--admin">
                ⚙️ Admin
              </Link>
            )}
            <Link to="/dashboard" className="header__btn header__btn--ghost">
              📊 Dashboard
            </Link>
            <Link to="/crear" className="header__btn header__btn--primary">
              + Nuevo reporte
            </Link>

            <button
              className="header__theme-toggle"
              onClick={toggleTheme}
              title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            <Link to="/perfil" className="header__user">
              <div className="header__avatar">
                {currentUser.photo
                  ? <img src={currentUser.photo} alt="perfil" />
                  : currentUser.avatar
                }
              </div>
              <span className="header__username">{currentUser.name}</span>
            </Link>

            <button className="header__logout" onClick={handleLogout} title="Cerrar sesión">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
