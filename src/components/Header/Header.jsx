import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../controllers/AuthController";
import UserAvatar from "../UserAvatar/UserAvatar";
import { useTheme } from "../../controllers/ThemeController";
import { getAll as getNotifications, marcarLeida, crearAlerta } from "../../models/notificacionModel";
import { getAll as getBarrios } from "../../models/barrioModel";
import { useToast } from "../../controllers/ToastController";
import MapPicker from "../MapPicker/MapPicker";
import "./Header.scss";

const CATEGORIAS_ALERTA = [
  { grupo: "🚨 EMERGENCIAS Y SEGURIDAD", items: ["Alerta de robo o delito en zona específica","Presencia de persona sospechosa","Tiroteo o situación de violencia activa","Alerta de secuestro o persona desaparecida","Incendio urbano o forestal","Explosión o fuga de gas"] },
  { grupo: "🌪️ CLIMA Y DESASTRES NATURALES", items: ["Tormenta eléctrica / granizo","Inundaciones o crecida de ríos","Vientos fuertes","Alerta por calor o frío extremo","Sismo o terremoto","Alerta temprana de desastres"] },
  { grupo: "🏥 SALUD PÚBLICA", items: ["Brote de enfermedad o epidemia","Alerta sanitaria (agua contaminada, alimentos)","Campaña de vacunación o jornada médica","Caso confirmado de enfermedad contagiosa en el barrio"] },
  { grupo: "🚧 SERVICIOS E INFRAESTRUCTURA", items: ["Corte de agua programado o de emergencia","Corte de luz / mantenimiento eléctrico","Corte de gas","Camino o ruta cortada / desvío de tránsito","Semáforos fuera de servicio","Obras en la vía pública"] },
  { grupo: "🗑️ MEDIO AMBIENTE", items: ["Día de recolección de residuos especiales","Fumigación o desinfección de zonas","Alerta por contaminación de aire o agua","Quema de pastizales cercana"] },
  { grupo: "📢 AVISOS COMUNITARIOS", items: ["Evento municipal (feria, acto, festival)","Reunión vecinal o asamblea","Cambio de horario en servicios públicos","Cierre temporal de dependencias municipales","Convocatoria a voluntariado"] },
  { grupo: "🚗 TRÁNSITO Y MOVILIDAD", items: ["Accidente de tránsito con vía cortada","Operativo de tránsito o control vehicular","Desvío por evento o manifestación","Alerta de bache peligroso o pavimento dañado"] },
  { grupo: "⚠️ ALERTAS SOCIALES", items: ["Animal peligroso suelto (perro agresivo, animal salvaje)","Alerta por estafa o fraude circulando en la ciudad","Persona en situación de calle que necesita asistencia","Alerta por violencia de género en zona pública"] },
];

export default function Header() {
  const { currentUser, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";
  const isSuperAdmin = currentUser?.role === "superadmin";

  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const notifRef = useRef(null);

  // --- Modal alerta ---
  const [showAlertaModal, setShowAlertaModal] = useState(false);
  const [grupoSel, setGrupoSel] = useState("");
  const [tipoSel, setTipoSel] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ubicacion, setUbicacion] = useState(null);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [barrio, setBarrio] = useState(null);
  const [barrios, setBarrios] = useState([]);
  const [loadingAlerta, setLoadingAlerta] = useState(false);

  const grupoActual = CATEGORIAS_ALERTA.find((c) => c.grupo === grupoSel);

  function abrirAlerta() {
    setShowAlertaModal(true);
    if (barrios.length === 0) getBarrios().then(setBarrios).catch(() => {});
  }

  function cerrarAlerta() {
    setShowAlertaModal(false);
    setGrupoSel(""); setTipoSel(""); setDescripcion("");
    setUbicacion(null); setMostrarMapa(false); setBarrio(null);
  }

  async function handleEnviarAlerta() {
    if (!tipoSel) return;
    const barrioNombre = barrios.find((b) => b.id === barrio)?.nombre;
    const barrioStr = barrioNombre ? `\n🏘️ Barrio: ${barrioNombre}` : "";
    const coordStr = ubicacion ? `\n📍 Ubicación: ${ubicacion.lat.toFixed(5)}, ${ubicacion.lng.toFixed(5)}` : "";
    const descStr = descripcion.trim() ? `\n\n${descripcion.trim()}` : "";
    const mensaje = `⚠️ ALERTA MUNICIPAL\n${tipoSel}${descStr}${barrioStr}${coordStr}`;
    cerrarAlerta();
    setLoadingAlerta(true);
    try {
      await crearAlerta(mensaje);
      addToast("Alerta municipal enviada a todos los usuarios", "success");
    } catch {
      addToast("Error al enviar la alerta", "error");
    } finally {
      setLoadingAlerta(false);
    }
  }

  function getPreview(mensaje) {
    const lines = mensaje.split("\n").filter((l) => l.trim());
    return lines.slice(0, 2).join(" · ");
  }

  function hasDetalle(mensaje) {
    return mensaje.split("\n").filter((l) => l.trim()).length > 2;
  }

  function getUbicacion(mensaje) {
    const match = mensaje.match(/📍 Ubicación: ([-\d.]+),\s*([-\d.]+)/);
    if (!match) return null;
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }

  useEffect(() => {
    if (!currentUser) return;
    function load() {
      getNotifications(currentUser.id)
        .then(setNotifications)
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.leida).length;

  async function handleMarkRead(id) {
    await marcarLeida(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: 1 } : n))
    );
  }

  async function handleNotifClick(n) {
    if (!n.leida) await handleMarkRead(n.id);
    if (n.link) {
      setShowNotif(false);
      navigate(n.link);
    } else if (hasDetalle(n.mensaje)) {
      setShowNotif(false);
      setSelectedNotif(n);
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.leida);
    await Promise.all(unread.map((n) => marcarLeida(n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: 1 })));
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
    <header className="header">
      <div className="header__inner">
        <Link to={isSuperAdmin ? "/super-admin" : isAdmin ? "/dashboard-admin" : currentUser?.role === "empleado" ? "/panel-empleado" : "/"} className="header__brand">
          <span className="header__brand-icon">🏙️</span>
          <span className="header__brand-name">ReportaMuni</span>
        </Link>

        {currentUser && (
          <nav className="header__nav">
            {isAdmin && (
              <Link to="/panel-admin" className="header__btn header__btn--ghost header__btn--admin">
                ⚙️ Admin
              </Link>
            )}
            {isAdmin ? (
              <button className="header__btn header__btn--primary header__btn--alerta" onClick={abrirAlerta}>
                🚨 Nueva alerta
              </button>
            ) : currentUser?.role !== "empleado" && (
              <Link to="/crear" className="header__btn header__btn--primary">
                + Nuevo reporte
              </Link>
            )}

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

            {/* Notificaciones */}
            <div className="header__notif" ref={notifRef}>
              <button
                className="header__notif-btn"
                onClick={() => setShowNotif((v) => !v)}
                title="Notificaciones"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="header__notif-badge">{unreadCount}</span>
                )}
              </button>

              {showNotif && (
                <div className="header__notif-panel">
                  <div className="header__notif-header">
                    <span>Notificaciones</span>
                    {unreadCount > 0 && (
                      <button className="header__notif-read-all" onClick={handleMarkAllRead}>
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  <div className="header__notif-list">
                    {notifications.length === 0 ? (
                      <p className="header__notif-empty">Sin notificaciones.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`header__notif-item ${!n.leida ? "header__notif-item--unread" : ""}`}
                          onClick={() => handleNotifClick(n)}
                        >
                          <p className="header__notif-msg">{getPreview(n.mensaje)}</p>
                          <div className="header__notif-footer">
                            <span className="header__notif-date">
                              {new Date(n.creadoEn).toLocaleDateString("es-AR", {
                                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                            {(n.link || hasDetalle(n.mensaje)) && (
                              <span className="header__notif-more">Ver →</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to={currentUser?.role === "empleado" ? "/perfil-empleado" : (currentUser?.role === "admin" || currentUser?.role === "superadmin") ? "/perfil-admin" : "/perfil-vecino"} className="header__user">
              <UserAvatar avatar={currentUser.avatar} size="sm" />
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

    {/* Modal Nueva Alerta */}
    {showAlertaModal && (
      <div className="alert-modal" onClick={(e) => e.target === e.currentTarget && cerrarAlerta()}>
        <div className="alert-modal__box">
          <div className="alert-modal__header">
            <div className="alert-modal__header-left">
              <span className="alert-modal__header-icon">🚨</span>
              <div>
                <h2 className="alert-modal__title">Nueva Alerta Municipal</h2>
                <p className="alert-modal__subtitle">Se enviará una notificación a todos los usuarios</p>
              </div>
            </div>
            <button className="alert-modal__close" onClick={cerrarAlerta}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="alert-modal__body">
            <div className="alert-modal__field">
              <label className="alert-modal__label"><span className="alert-modal__label-num">1</span>Categoría de la alerta</label>
              <div className="alert-modal__grupos">
                {CATEGORIAS_ALERTA.map((cat) => (
                  <button key={cat.grupo} className={`alert-modal__grupo-btn ${grupoSel === cat.grupo ? "alert-modal__grupo-btn--active" : ""}`} onClick={() => { setGrupoSel(cat.grupo); setTipoSel(""); }}>{cat.grupo}</button>
                ))}
              </div>
            </div>
            {grupoActual && (
              <div className="alert-modal__field">
                <label className="alert-modal__label"><span className="alert-modal__label-num">2</span>Tipo de alerta</label>
                <div className="alert-modal__tipos">
                  {grupoActual.items.map((item) => (
                    <button key={item} className={`alert-modal__tipo-btn ${tipoSel === item ? "alert-modal__tipo-btn--active" : ""}`} onClick={() => setTipoSel(item)}>
                      {tipoSel === item && <span className="alert-modal__tipo-check">✓</span>}{item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {tipoSel && (
              <div className="alert-modal__field">
                <label className="alert-modal__label"><span className="alert-modal__label-num">3</span>Mensaje para los vecinos<span className="alert-modal__label-optional">(opcional)</span></label>
                <textarea className="alert-modal__textarea" placeholder="Describe la situación con detalles relevantes..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={4}/>
                <p className="alert-modal__chars">{descripcion.length} caracteres</p>
              </div>
            )}
            {tipoSel && (
              <div className="alert-modal__field">
                <label className="alert-modal__label"><span className="alert-modal__label-num">4</span>Barrio afectado<span className="alert-modal__label-optional">(opcional)</span></label>
                <select className="alert-modal__select" value={barrio ?? ""} onChange={(e) => setBarrio(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Sin barrio específico</option>
                  {barrios.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>
            )}
            {tipoSel && (
              <div className="alert-modal__field">
                <label className="alert-modal__label"><span className="alert-modal__label-num">5</span>Zona de la alerta<span className="alert-modal__label-optional">(opcional)</span></label>
                <button className={`alert-modal__map-toggle ${mostrarMapa ? "alert-modal__map-toggle--active" : ""}`} onClick={() => { setMostrarMapa((v) => !v); if (mostrarMapa) setUbicacion(null); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {mostrarMapa ? "Quitar ubicación" : "Agregar ubicación en el mapa"}
                </button>
                {mostrarMapa && (
                  <div className="alert-modal__map-wrap">
                    <p className="alert-modal__map-hint">Hacé clic en el mapa para marcar la zona afectada</p>
                    <MapPicker value={ubicacion} onChange={setUbicacion} height="240px"/>
                    {ubicacion && <p className="alert-modal__map-coords">📍 Marcado: {ubicacion.lat.toFixed(5)}, {ubicacion.lng.toFixed(5)}</p>}
                  </div>
                )}
              </div>
            )}
            {tipoSel && (
              <div className="alert-modal__preview">
                <p className="alert-modal__preview-label">Vista previa:</p>
                <div className="alert-modal__preview-box">
                  <p className="alert-modal__preview-title">⚠️ ALERTA MUNICIPAL</p>
                  <p className="alert-modal__preview-tipo">{tipoSel}</p>
                  {descripcion && <p className="alert-modal__preview-desc">{descripcion}</p>}
                  {barrio && barrios.find((b) => b.id === barrio) && <p className="alert-modal__preview-desc">🏘️ Barrio: {barrios.find((b) => b.id === barrio).nombre}</p>}
                  {ubicacion && <p className="alert-modal__preview-desc">📍 Ubicación: {ubicacion.lat.toFixed(5)}, {ubicacion.lng.toFixed(5)}</p>}
                </div>
              </div>
            )}
          </div>
          <div className="alert-modal__footer">
            <button className="alert-modal__btn-cancel" onClick={cerrarAlerta}>Cancelar</button>
            <button className="alert-modal__btn-send" onClick={handleEnviarAlerta} disabled={!tipoSel || loadingAlerta}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Enviar a todos los usuarios
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal de detalle de notificación */}
    {selectedNotif && (
      <div className="notif-modal" onClick={(e) => e.target === e.currentTarget && setSelectedNotif(null)}>
        <div className="notif-modal__box">
          <div className="notif-modal__header">
            <h3 className="notif-modal__title">Detalle de notificación</h3>
            <button className="notif-modal__close" onClick={() => setSelectedNotif(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="notif-modal__body">
            <p className="notif-modal__mensaje">{selectedNotif.mensaje}</p>
            {getUbicacion(selectedNotif.mensaje) && (
              <div className="notif-modal__map">
                <MapPicker value={getUbicacion(selectedNotif.mensaje)} readOnly height="220px" />
              </div>
            )}
          </div>
          <div className="notif-modal__footer">
            <span className="notif-modal__date">
              {new Date(selectedNotif.creadoEn).toLocaleDateString("es-AR", {
                weekday: "long", day: "2-digit", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
            <button className="notif-modal__btn" onClick={() => setSelectedNotif(null)}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
