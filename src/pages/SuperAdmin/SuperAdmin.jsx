import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSuperAdminDashboard, getAllUsuarios, createUsuario, updateUsuario, deleteUsuario } from "../../models/usuarioModel";
import { triggerPasswordReset } from "../../models/authModel";
import { useToast } from "../../controllers/ToastController";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import AvatarPicker from "../../components/AvatarPicker/AvatarPicker";
import { AVATARES_MUNICIPIO } from "../../utils/avatares";
import "./SuperAdmin.scss";

const ROLES = ["superadmin", "admin", "empleado", "vecino"];
const ROLES_CREABLES = ["superadmin", "admin", "empleado"];
const ROL_LABEL  = { superadmin: "SuperAdmin", admin: "Admin", empleado: "Empleado", vecino: "Vecino" };
const ROL_COLOR  = {
  superadmin: { bg: "#fdf4ff", color: "#7c3aed" },
  admin:      { bg: "#eff6ff", color: "#2563eb" },
  empleado:   { bg: "#f0fdf4", color: "#16a34a" },
  vecino:     { bg: "#f8fafc", color: "#64748b" },
};
const EMPTY_FORM = { username: "", password: "", name: "", avatar: AVATARES_MUNICIPIO[0].emoji, role: "empleado" };

function StatCard({ icon, label, value, color, to }) {
  const inner = (
    <>
      <span className="sa-stat__icon">{icon}</span>
      <span className="sa-stat__value" style={{ color }}>{value}</span>
      <span className="sa-stat__label">{label}</span>
    </>
  );
  if (to) {
    return (
      <Link className="sa-stat sa-stat--link" style={{ borderColor: color }} to={to}>
        {inner}
      </Link>
    );
  }
  return <div className="sa-stat" style={{ borderColor: color }}>{inner}</div>;
}

function AlertPanel({ icon, title, color, children, count }) {
  return (
    <div className="sa-alert-panel" style={{ borderColor: color }}>
      <div className="sa-alert-panel__header" style={{ background: color + "18" }}>
        <span>{icon}</span>
        <span className="sa-alert-panel__title">{title}</span>
        <span className="sa-alert-panel__badge" style={{ background: color, color: "#fff" }}>{count}</span>
      </div>
      <div className="sa-alert-panel__body">{children}</div>
    </div>
  );
}

export default function SuperAdmin() {
  const { addToast } = useToast();
  const [tab, setTab] = useState("dashboard");

  // Dashboard
  const [dash, setDash]           = useState(null);
  const [loadingDash, setLoadingDash] = useState(true);

  // Usuarios
  const [usuarios, setUsuarios]   = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [tabRol, setTabRol]       = useState("todos");
  const [busqueda, setBusqueda]   = useState("");
  const [modal, setModal]         = useState(null);
  const [editando, setEditando]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [guardando, setGuardando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [reseteandoPwd, setReseteandoPwd] = useState(null);

  useEffect(() => {
    setLoadingDash(true);
    getSuperAdminDashboard()
      .then(setDash)
      .catch(() => addToast("Error al cargar el dashboard", "error"))
      .finally(() => setLoadingDash(false));
  }, []);

  useEffect(() => {
    if (tab === "usuarios" && usuarios.length === 0) {
      setLoadingUsers(true);
      getAllUsuarios().then(setUsuarios).catch(() => {}).finally(() => setLoadingUsers(false));
    }
  }, [tab]);

  // ── Usuarios CRUD ────────────────────────────────────────
  function abrirCrear() { setForm(EMPTY_FORM); setEditando(null); setModal("crear"); }
  function abrirEditar(u) { setForm({ username: u.username, password: "", name: u.name, avatar: u.avatar ?? AVATARES_MUNICIPIO[0].emoji, role: u.role }); setEditando(u); setModal("editar"); }
  function cerrarModal() { setModal(null); setEditando(null); setForm(EMPTY_FORM); }

  async function handleGuardar() {
    if (!form.name.trim()) return addToast("El nombre es obligatorio", "error");
    if (modal === "crear" && (!form.username.trim() || !form.password.trim()))
      return addToast("Usuario y contraseña son obligatorios", "error");
    setGuardando(true);
    try {
      if (modal === "crear") {
        const nuevo = await createUsuario(form);
        setUsuarios((prev) => [...prev, nuevo]);
        addToast("Usuario creado correctamente", "success");
      } else {
        const actualizado = await updateUsuario(editando.id, { name: form.name, role: form.role, avatar: form.avatar });
        setUsuarios((prev) => prev.map((u) => (u.id === editando.id ? actualizado : u)));
        addToast("Usuario actualizado", "success");
      }
      cerrarModal();
    } catch (e) {
      addToast(e?.message || "Error al guardar", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(u) {
    try {
      await deleteUsuario(u.id);
      setUsuarios((prev) => prev.filter((x) => x.id !== u.id));
      addToast("Usuario eliminado", "success");
    } catch {
      addToast("Error al eliminar usuario", "error");
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleResetPassword(u) {
    setReseteandoPwd(u.id);
    try {
      await triggerPasswordReset(u.id);
      addToast(`Email de recuperación enviado a ${u.name}.`, "success");
    } catch (err) {
      addToast(err.message || "Error al enviar el email.", "error");
    } finally {
      setReseteandoPwd(null);
    }
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    if (tabRol !== "todos" && u.role !== tabRol) return false;
    if (busqueda && !u.name.toLowerCase().includes(busqueda.toLowerCase()) && !u.username.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const conteo = (rol) => usuarios.filter((u) => u.role === rol).length;

  // ── Render dashboard ────────────────────────────────────
  function renderDashboard() {
    if (loadingDash) return <p className="sa__empty">Cargando...</p>;
    if (!dash) return null;
    const { totales, alertas, rendimiento, actividadReciente } = dash;
    const totalAlertas = alertas.vencidos.length + alertas.bloqueantes.length + alertas.abandonados.length;

    return (
      <div className="sa-dashboard">

        {/* Stats generales */}
        <div className="sa-stats">
          <StatCard icon="📋" label="Total reportes"   value={totales.total}      color="#2563eb" to="/panel-admin" />
          <StatCard icon="⏳" label="Sin asignar"      value={totales.sinAsignar}  color="#d97706" to="/panel-admin?status=pendiente" />
          <StatCard icon="🔧" label="En proceso"       value={totales.enProceso}   color="#0891b2" to="/panel-admin?status=en_proceso" />
          <StatCard icon="✅" label="Resueltos"        value={totales.resueltos}   color="#16a34a" to="/panel-admin?status=resuelto" />
        </div>

        {/* Alertas */}
        {totalAlertas > 0 && (
          <section className="sa-section">
            <h2 className="sa-section__title">⚠️ Alertas que requieren atención</h2>
            <div className="sa-alerts-grid">

              {alertas.vencidos.length > 0 && (
                <AlertPanel icon="📅" title="Fecha límite vencida" color="#dc2626" count={alertas.vencidos.length}>
                  {alertas.vencidos.map((r) => (
                    <Link key={r.id} to={`/reporte/${r.id}`} className="sa-alert-item">
                      <span className="sa-alert-item__title">{r.titulo}</span>
                      <span className="sa-alert-item__meta">
                        {r.empleado} · Venció {new Date(r.fecha_limite).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                      </span>
                    </Link>
                  ))}
                </AlertPanel>
              )}

              {alertas.bloqueantes.length > 0 && (
                <AlertPanel icon="🔴" title="Novedades bloqueantes sin respuesta" color="#7c3aed" count={alertas.bloqueantes.length}>
                  {alertas.bloqueantes.map((n) => (
                    <Link key={n.id} to={`/reporte/${n.reporteId}`} className="sa-alert-item">
                      <span className="sa-alert-item__title">{n.reporteTitulo}</span>
                      <span className="sa-alert-item__meta">{n.empleado} · {n.descripcion.slice(0, 60)}{n.descripcion.length > 60 ? "..." : ""}</span>
                    </Link>
                  ))}
                </AlertPanel>
              )}

              {alertas.abandonados.length > 0 && (
                <AlertPanel icon="🚨" title="Reportes abandonados (+30 días)" color="#d97706" count={alertas.abandonados.length}>
                  {alertas.abandonados.map((r) => (
                    <Link key={r.id} to={`/reporte/${r.id}`} className="sa-alert-item">
                      <span className="sa-alert-item__title">{r.titulo}</span>
                      <span className="sa-alert-item__meta">{r.dias} días sin movimiento</span>
                    </Link>
                  ))}
                </AlertPanel>
              )}

            </div>
          </section>
        )}

        {/* Rendimiento empleados */}
        {rendimiento.empleados.length > 0 && (
          <section className="sa-section">
            <h2 className="sa-section__title">👷 Rendimiento de empleados</h2>
            <div className="sa-perf-list">
              {rendimiento.empleados.map((e) => (
                <Link key={e.id} className="sa-perf-row" to={`/perfil-empleado/${e.id}`}>
                  <UserAvatar avatar={e.avatar ?? AVATARES_MUNICIPIO[0].emoji} size="sm" />
                  <span className="sa-perf-row__name">{e.nombre}</span>
                  <div className="sa-perf-row__stats">
                    <span className="sa-perf-row__stat sa-perf-row__stat--green">
                      👑 {e.totalComoLider ?? 0} como líder
                      <span className="sa-perf-row__stat-check"> ✓{e.resueltosComoLider ?? 0}</span>
                    </span>
                    <span className="sa-perf-row__stat sa-perf-row__stat--green">
                      👤 {e.totalComoMiembro ?? 0} como miembro
                      <span className="sa-perf-row__stat-check"> ✓{e.participacionesComoMiembro ?? 0}</span>
                    </span>
                    <span className="sa-perf-row__stat sa-perf-row__stat--blue">🔧 {e.enCurso} en curso</span>
                    <span className="sa-perf-row__stat sa-perf-row__stat--purple">📈 {e.avances} avances</span>
                    <span className="sa-perf-row__stat sa-perf-row__stat--orange">⚠️ {e.novedades} novedades</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Rendimiento admins */}
        {rendimiento.admins.length > 0 && (
          <section className="sa-section">
            <h2 className="sa-section__title">⚙️ Actividad de administradores</h2>
            <div className="sa-perf-list">
              {rendimiento.admins.map((a) => (
                <Link key={a.id} className="sa-perf-row" to={`/perfil-admin/${a.id}`}>
                  <UserAvatar avatar={a.avatar ?? AVATARES_MUNICIPIO[0].emoji} size="sm" />
                  <span className="sa-perf-row__name">{a.nombre}</span>
                  <div className="sa-perf-row__stats">
                    <span className="sa-perf-row__stat sa-perf-row__stat--blue">📋 {a.reportesAtendidos ?? 0} atendidos</span>
                    <span className="sa-perf-row__stat sa-perf-row__stat--orange">🔁 {a.reasignaciones ?? 0} reasignaciones</span>
                    <span className="sa-perf-row__stat sa-perf-row__stat--green">💬 {a.novedadesRespondidas ?? 0} novedades respondidas</span>
                    <span className="sa-perf-row__stat sa-perf-row__stat--purple">
                      ⏱ {a.promedioRespuesta != null ? `${a.promedioRespuesta}d` : "—"} promedio
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Actividad reciente */}
        {actividadReciente.length > 0 && (
          <section className="sa-section">
            <h2 className="sa-section__title">🕐 Actividad reciente</h2>
            <div className="sa-activity">
              {actividadReciente.map((h) => (
                <Link key={h.id} to={`/reporte/${h.reporteId}`} className="sa-activity__item">
                  <div className="sa-activity__info">
                    <span className="sa-activity__title">{h.reporteTitulo}</span>
                    <span className="sa-activity__meta">
                      {h.quien} cambió de <strong>{h.estado_anterior}</strong> a <strong>{h.estado_nuevo}</strong>
                    </span>
                  </div>
                  <span className="sa-activity__date">
                    {new Date(h.cambiado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    );
  }

  // ── Render usuarios ──────────────────────────────────────
  function renderUsuarios() {
    return (
      <div className="sa-usuarios">
        <div className="sa-usuarios__toolbar">
          <div className="sa-tabs-rol">
            {["todos", ...ROLES].map((t) => (
              <button key={t} className={`sa-tab-rol ${tabRol === t ? "sa-tab-rol--active" : ""}`} onClick={() => setTabRol(t)}>
                {t === "todos" ? "Todos" : ROL_LABEL[t]}
                <span className="sa-tab-rol__count">{t === "todos" ? usuarios.length : conteo(t)}</span>
              </button>
            ))}
          </div>
          <div className="sa-usuarios__right">
            <input className="sa-search" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <button className="sa-btn-crear" onClick={abrirCrear}>+ Nuevo usuario</button>
          </div>
        </div>

        {loadingUsers ? (
          <p className="sa__empty">Cargando...</p>
        ) : usuariosFiltrados.length === 0 ? (
          <p className="sa__empty">No hay usuarios en esta categoría.</p>
        ) : (
          <div className="sa-user-list">
            {usuariosFiltrados.map((u) => {
              const rc = ROL_COLOR[u.role];
              return (
                <div key={u.id} className="sa-user">
                  <UserAvatar avatar={u.avatar ?? AVATARES_MUNICIPIO[0].emoji} size="sm" />
                  <div className="sa-user__info">
                    <span className="sa-user__name">{u.name}</span>
                    <span className="sa-user__username">@{u.username}</span>
                  </div>
                  <span className="sa-user__rol" style={{ background: rc.bg, color: rc.color }}>{ROL_LABEL[u.role]}</span>
                  <div className="sa-user__actions">
                    <button className="sa-btn-edit" onClick={() => abrirEditar(u)}>Editar</button>
                    <button
                      className="sa-btn-reset"
                      onClick={() => handleResetPassword(u)}
                      disabled={reseteandoPwd === u.id}
                      title="Enviar email de recuperación de contraseña"
                    >
                      {reseteandoPwd === u.id ? "..." : "Reset pwd"}
                    </button>
                    <button className="sa-btn-delete" onClick={() => setConfirmDelete(u)}>Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="superadmin">
      <div className="superadmin__container">

        <div className="superadmin__header">
          <div>
            <h1 className="superadmin__title">Panel de supervisión</h1>
            <p className="superadmin__subtitle">Vista ejecutiva del sistema ReportaMuni</p>
          </div>
        </div>

        <div className="superadmin__tabs">
          <button className={`superadmin__tab ${tab === "dashboard" ? "superadmin__tab--active" : ""}`} onClick={() => setTab("dashboard")}>
            📊 Dashboard
          </button>
          <button className={`superadmin__tab ${tab === "usuarios" ? "superadmin__tab--active" : ""}`} onClick={() => setTab("usuarios")}>
            👥 Gestión de usuarios
          </button>
        </div>

        {tab === "dashboard" ? renderDashboard() : renderUsuarios()}

      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="superadmin-modal" onClick={(e) => e.target === e.currentTarget && cerrarModal()}>
          <div className="superadmin-modal__box">
            <div className="superadmin-modal__header">
              <h3 className="superadmin-modal__title">{modal === "crear" ? "Nuevo usuario" : `Editar — ${editando?.name}`}</h3>
              <button className="superadmin-modal__close" onClick={cerrarModal}>✕</button>
            </div>
            <div className="superadmin-modal__body">
              <label className="superadmin-modal__label">Nombre completo</label>
              <input className="superadmin-modal__input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej: Juan Pérez" />
              {modal === "crear" && (
                <>
                  <label className="superadmin-modal__label">Nombre de usuario</label>
                  <input className="superadmin-modal__input" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="Ej: jperez" autoComplete="off" />
                  <label className="superadmin-modal__label">Contraseña</label>
                  <input className="superadmin-modal__input" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Contraseña inicial" autoComplete="new-password" />
                </>
              )}
              <label className="superadmin-modal__label">Rol</label>
              <select className="superadmin-modal__select" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                {(modal === "crear" ? ROLES_CREABLES : ROLES).map((r) => (
                  <option key={r} value={r}>{ROL_LABEL[r]}</option>
                ))}
              </select>
              <label className="superadmin-modal__label">Avatar</label>
              <AvatarPicker value={form.avatar} onChange={(av) => setForm((f) => ({ ...f, avatar: av }))} set={AVATARES_MUNICIPIO} />
            </div>
            <div className="superadmin-modal__footer">
              <button className="superadmin-modal__btn-cancel" onClick={cerrarModal}>Cancelar</button>
              <button className="superadmin-modal__btn-save" onClick={handleGuardar} disabled={guardando}>
                {guardando ? "Guardando..." : modal === "crear" ? "Crear usuario" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="superadmin-modal" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="superadmin-modal__box superadmin-modal__box--sm">
            <div className="superadmin-modal__header">
              <h3 className="superadmin-modal__title">Eliminar usuario</h3>
              <button className="superadmin-modal__close" onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <div className="superadmin-modal__body">
              <p className="superadmin-modal__confirm-text">
                ¿Estás seguro que querés eliminar a <strong>{confirmDelete.name}</strong> (@{confirmDelete.username})? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="superadmin-modal__footer">
              <button className="superadmin-modal__btn-cancel" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="superadmin-modal__btn-delete" onClick={() => handleEliminar(confirmDelete)}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
