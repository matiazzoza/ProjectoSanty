import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../controllers/AuthController";
import "./AdminSidebar.scss";

export default function AdminSidebar() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);

  if (!currentUser || currentUser.role !== "admin") return null;

  return (
    <>
      {/* Botón flotante de apertura */}
      <button
        className={`admin-sidebar__toggle ${open ? "admin-sidebar__toggle--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Panel de administración"
      >
        <span className="admin-sidebar__toggle-icon">
          {open ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </span>
        <span className="admin-sidebar__toggle-label">Admin</span>
      </button>

      {/* Overlay */}
      {open && (
        <div className="admin-sidebar__overlay" onClick={() => setOpen(false)} />
      )}

      {/* Panel lateral */}
      <aside className={`admin-sidebar__panel ${open ? "admin-sidebar__panel--open" : ""}`}>
        <div className="admin-sidebar__header">
          <div className="admin-sidebar__header-info">
            <div className="admin-sidebar__header-avatar">
              {currentUser.photo ? (
                <img src={currentUser.photo} alt="admin" />
              ) : (
                currentUser.avatar
              )}
            </div>
            <div>
              <p className="admin-sidebar__header-name">{currentUser.name}</p>
              <p className="admin-sidebar__header-role">Administrador Municipal</p>
            </div>
          </div>
          <button className="admin-sidebar__close" onClick={() => setOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="admin-sidebar__section-title">Herramientas</div>

        <nav className="admin-sidebar__menu">
          <Link to="/tablero-reportes" className="admin-sidebar__item" onClick={() => setOpen(false)}>
            <span className="admin-sidebar__item-icon">📋</span>
            <div className="admin-sidebar__item-text">
              <span className="admin-sidebar__item-name">Tablero municipal</span>
              <span className="admin-sidebar__item-desc">Ver reportes de la comunidad</span>
            </div>
            <svg className="admin-sidebar__item-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
          <Link to="/crear" className="admin-sidebar__item" onClick={() => setOpen(false)}>
            <span className="admin-sidebar__item-icon">📝</span>
            <div className="admin-sidebar__item-text">
              <span className="admin-sidebar__item-name">Nuevo reporte</span>
              <span className="admin-sidebar__item-desc">Crear un reporte municipal</span>
            </div>
            <svg className="admin-sidebar__item-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </nav>

        <div className="admin-sidebar__footer">
          ReportaMuni — Panel Admin
        </div>
      </aside>
    </>
  );
}
