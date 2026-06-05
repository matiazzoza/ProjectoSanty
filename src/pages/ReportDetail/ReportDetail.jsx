import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../controllers/AuthController";
import { useReports } from "../../controllers/ReportsController";
import { useToast } from "../../controllers/ToastController";
import { CATEGORIES, STATUSES } from "../../data/mockReports";
import MapPicker from "../../components/MapPicker/MapPicker";
import { toggle as toggleSeguir, getByUsuario as getSeguidos } from "../../models/seguimientoModel";
import { getHistorial, getById as getReporteById, cancelarReporte, enviarVerificacion } from "../../models/reporteModel";
import { getEmpleados, asignar, getAsignacionesReporte, getHistorialAsignacionesReporte, validarCierre, rechazarCierre, resolverPropuesta } from "../../models/asignacionModel";
import { getNovedades, responderNovedad } from "../../models/novedadModel";
import { getAvances } from "../../models/avanceModel";
import { getPrioridad } from "../../utils/prioridad";
import { ESPECIALIDADES, CATEGORIA_ESPECIALIDAD } from "../../data/especialidades";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import "./ReportDetail.scss";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

function formatDateShort(iso) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getReport, toggleVote, deleteReport, updateStatus, addComment, deleteComment, updateReport } = useReports();

  const { addToast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [siguiendo, setSiguiendo] = useState(false);
  const [loadingSeguir, setLoadingSeguir] = useState(false);
  const [historial, setHistorial] = useState([]);

  // Asignaciones (admin)
  const [empleados, setEmpleados] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [historialEquipos, setHistorialEquipos] = useState([]);
  const [showHistorialEquipos, setShowHistorialEquipos] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState("");
  const [miembrosSeleccionados, setMiembrosSeleccionados] = useState([]);
  const [prioridadSeleccionada, setPrioridadSeleccionada] = useState("media");
  const [fechaLimite, setFechaLimite] = useState("");
  const [loadingAsignar, setLoadingAsignar] = useState(false);

  useEffect(() => {
    const lider = asignaciones.find((a) => a.es_lider && a.aprobado === "aprobado");
    const miembros = asignaciones.filter((a) => !a.es_lider && a.aprobado === "aprobado").map((a) => a.empleado_id);
    setEmpleadoSeleccionado(lider?.empleado_id ?? "");
    setPrioridadSeleccionada(lider?.prioridad ?? "media");
    setFechaLimite(lider?.fechaLimite ? lider.fechaLimite.slice(0, 10) : "");
    setMiembrosSeleccionados(miembros);
  }, [asignaciones]);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  // Estado fresco desde la API (para validaciones de permisos)
  const [freshStatus, setFreshStatus] = useState(null);

  // Novedades
  const [novedades, setNovedades] = useState([]);
  const [respuestas, setRespuestas] = useState({});

  // Avances
  const [avances, setAvances] = useState([]);

  const [expandidosEquipo, setExpandidosEquipo] = useState({});

  const [modalCancelar, setModalCancelar] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [loadingCancelar, setLoadingCancelar] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState(null);

  const [modalVerificar, setModalVerificar] = useState(false);
  const [verificadorSeleccionado, setVerificadorSeleccionado] = useState("");
  const [loadingVerificar, setLoadingVerificar] = useState(false);

  const report = getReport(id);

  useEffect(() => {
    if (!currentUser || !report) return;

    // Obtener estado fresco del reporte desde la API
    getReporteById(report.id).then((r) => {
      setFreshStatus(r.status);
      if (r.motivoCancelacion) setCancelMotivo(r.motivoCancelacion);
    }).catch(() => {});

    getSeguidos(currentUser.id)
      .then((ids) => setSiguiendo(ids.includes(report.id)))
      .catch(() => {});
    getHistorial(report.id)
      .then(setHistorial)
      .catch(() => {});

    getAvances(report.id).then(setAvances).catch(() => {});

    if (currentUser?.role === "admin" || currentUser?.role === "superadmin") {
      getEmpleados().then(setEmpleados).catch(() => {});
      getAsignacionesReporte(report.id).then(setAsignaciones).catch(() => {});
      getHistorialAsignacionesReporte(report.id).then(setHistorialEquipos).catch(() => {});
      getNovedades(report.id).then(setNovedades).catch(() => {});
    }
  }, [currentUser?.id, report?.id]);

  if (!report) {
    return (
      <div className="report-detail report-detail--not-found">
        <p>Reporte no encontrado.</p>
        <button onClick={() => navigate("/tablero-reportes")}>← Volver al inicio</button>
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.id === report.category);
  const statusInfo = STATUSES.find((s) => s.id === report.status) ?? STATUSES[0];
  const prioridad = getPrioridad(report.votes);
  const hasVoted = currentUser ? report.votes.includes(currentUser.id) : false;
  const isOwner = currentUser?.id === report.authorId;
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";
  const canChangeStatus = isAdmin;
  const canVote = currentUser && report.status === "pendiente";
  // Esperar el estado fresco antes de mostrar acciones destructivas
  const isPendiente = freshStatus === "pendiente";

  // Último porcentaje de avance
  const ultimoAvance = avances.length > 0 ? avances[avances.length - 1] : null;
  const ultimoPorcentaje = ultimoAvance?.porcentaje ?? null;

  // Historial simplificado para todos
  function historialSimplificado() {
    const items = [{ icon: "📋", texto: "Reporte creado", fecha: report.createdAt }];
    historial.forEach((h) => {
      if (h.estado_nuevo === "en_proceso") items.push({ icon: "🏛️", texto: "Tomado por el municipio", fecha: h.cambiado_en });
      else if (h.estado_nuevo === "resuelto")   items.push({ icon: "✅", texto: "Resuelto por el municipio", fecha: h.cambiado_en });
      else if (h.estado_nuevo === "duplicado")  items.push({ icon: "🔁", texto: "Marcado como duplicado", fecha: h.cambiado_en });
    });
    return items;
  }

  function handleVote() {
    if (!canVote) return;
    toggleVote(report.id, currentUser.id);
    addToast(hasVoted ? "Voto eliminado" : "¡Reporte apoyado!", hasVoted ? "info" : "success");
  }

  function handleDelete() {
    if (window.confirm("¿Eliminar este reporte?")) {
      deleteReport(report.id);
      addToast("Reporte eliminado", "info");
      navigate("/tablero-reportes");
    }
  }

  function handleStatusChange(e) {
    updateStatus(report.id, e.target.value);
    addToast("Estado actualizado", "success");
  }

  function handleMarkDuplicate() {
    if (window.confirm("¿Marcar este reporte como duplicado?")) {
      updateStatus(report.id, "duplicado");
      addToast("Reporte marcado como duplicado", "warning");
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      addToast("¡Enlace copiado al portapapeles!", "success");
    });
  }

  function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(report.id, {
      id: `c${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    });
    setCommentText("");
    addToast("Comentario publicado", "success");
  }

  function handleDeleteComment(commentId) {
    deleteComment(report.id, commentId);
  }

  async function handleAsignar() {
    if (!empleadoSeleccionado) return;
    setLoadingAsignar(true);
    try {
      await asignar(report.id, empleadoSeleccionado, prioridadSeleccionada, fechaLimite || null, miembrosSeleccionados);
      const nuevas = await getAsignacionesReporte(report.id);
      setAsignaciones(nuevas);
      setMiembrosSeleccionados([]);
      addToast("Equipo asignado correctamente", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoadingAsignar(false);
    }
  }

  function toggleMiembro(id) {
    setMiembrosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  async function handleResolverPropuesta(empleadoId, accion) {
    try {
      await resolverPropuesta(report.id, empleadoId, accion);
      const nuevas = await getAsignacionesReporte(report.id);
      setAsignaciones(nuevas);
      addToast(accion === 'aprobar' ? 'Propuesta aprobada' : 'Propuesta rechazada', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  async function handleValidarCierre() {
    try {
      await validarCierre(report.id);
      addToast("Reporte validado como resuelto", "success");
      updateStatus(report.id, "resuelto");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  async function handleResponderNovedad(novedadId) {
    const respuesta = respuestas[novedadId];
    if (!respuesta?.trim()) return;
    try {
      await responderNovedad(novedadId, respuesta.trim());
      setNovedades((prev) =>
        prev.map((n) => n.id === novedadId ? { ...n, respuesta_admin: respuesta.trim() } : n)
      );
      setRespuestas((prev) => ({ ...prev, [novedadId]: "" }));
      addToast("Respuesta enviada. El empleado fue notificado.", "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  async function handleRechazarCierre() {
    try {
      await rechazarCierre(report.id, motivoRechazo);
      addToast("Cierre rechazado. Se notificó al empleado.", "warning");
      setMotivoRechazo("");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  async function handleEnviarVerificacion() {
    if (!verificadorSeleccionado) return;
    setLoadingVerificar(true);
    try {
      await enviarVerificacion(report.id, verificadorSeleccionado);
      updateStatus(report.id, "en_verificacion");
      addToast("Reporte enviado a verificación. Se notificó al empleado.", "success");
      setModalVerificar(false);
      setVerificadorSeleccionado("");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoadingVerificar(false);
    }
  }

  async function handleCancelar() {
    if (!motivoCancelacion) return;
    setLoadingCancelar(true);
    try {
      await cancelarReporte(report.id, motivoCancelacion);
      updateStatus(report.id, "cancelado");
      setCancelMotivo(motivoCancelacion);
      addToast("Reporte cancelado. Se notificó al vecino.", "success");
      setModalCancelar(false);
      setMotivoCancelacion("");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoadingCancelar(false);
    }
  }

  async function handleToggleSeguir() {
    if (!currentUser || loadingSeguir) return;
    setLoadingSeguir(true);
    try {
      const res = await toggleSeguir(report.id, currentUser.id);
      setSiguiendo(res.siguiendo);
      addToast(res.siguiendo ? "Ahora seguís este reporte" : "Dejaste de seguir este reporte", res.siguiendo ? "success" : "info");
    } catch {
      addToast("Error al actualizar seguimiento", "error");
    } finally {
      setLoadingSeguir(false);
    }
  }

  return (
    <div className="report-detail">
      <div className="report-detail__container">
        <button className="report-detail__back" onClick={() => navigate(-1)}>
          ← Volver
        </button>

        <div className="report-detail__card">
          {/* Meta: categoría + estado */}
          <div className="report-detail__meta">
            {category && (
              <span className="report-detail__category">
                {category.icon} {category.label}
              </span>
            )}
            <span
              className="report-detail__status-badge"
              style={{ color: statusInfo.color, borderColor: statusInfo.color, background: `${statusInfo.color}14` }}
            >
              {statusInfo.label}
            </span>
            {report.status === "en_proceso" && ultimoPorcentaje !== null && (
              <div className="report-detail__progreso">
                <div className="report-detail__progreso-bar">
                  <div className="report-detail__progreso-fill" style={{ width: `${ultimoPorcentaje}%` }} />
                </div>
                <span className="report-detail__progreso-label">{ultimoPorcentaje}% completado</span>
              </div>
            )}
          </div>

          {isAdmin && report.verificacionResultado && (
            <div className={`report-detail__verificacion-banner report-detail__verificacion-banner--${report.verificacionResultado}`}>
              <span className="report-detail__verificacion-titulo">
                {report.verificacionResultado === 'confirma' ? '✅ Verificado: problema confirmado' : '⚠️ Verificado: problema no encontrado'}
              </span>
              {report.verificacionNota && (
                <span className="report-detail__verificacion-nota">{report.verificacionNota}</span>
              )}
              {report.fotoVerificacion && (
                <img src={report.fotoVerificacion} alt="foto verificación" className="report-detail__verificacion-foto" />
              )}
            </div>
          )}

          {report.status === "cancelado" && (() => {
            const MOTIVOS = {
              fuera_jurisdiccion:   'Fuera de jurisdicción municipal',
              problema_inexistente: 'El problema ya no existe',
              acceso_denegado:      'Acceso al lugar denegado',
              sin_recursos:         'Sin recursos disponibles',
              duplicado:            'Reporte duplicado',
            };
            const motivo = cancelMotivo || report.motivoCancelacion;
            return (
              <div className="report-detail__cancelado-banner">
                <span className="report-detail__cancelado-titulo">❌ Reporte cancelado</span>
                {motivo && (
                  <span className="report-detail__cancelado-motivo">Motivo: {MOTIVOS[motivo] ?? motivo}</span>
                )}
              </div>
            );
          })()}

          {prioridad.label && (
            <span className="report-detail__prioridad-badge" style={{ color: prioridad.color, background: prioridad.bg, borderColor: prioridad.border }}>
              🔥 Prioridad {prioridad.label}
            </span>
          )}

          <div className="report-detail__top-row">
            <h1 className="report-detail__title">{report.title}</h1>
            {isOwner && isPendiente && (
              <Link to={`/editar/${report.id}`} className="report-detail__edit-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Editar
              </Link>
            )}
          </div>

          <div className="report-detail__author">
            <div className="report-detail__author-avatar">
              {report.authorName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="report-detail__author-name">{report.authorName}</span>
              <span className="report-detail__author-label">{formatDate(report.createdAt)}</span>
            </div>
          </div>

          <p className="report-detail__description">{report.description}</p>

          {/* Ubicación */}
          {report.location && (
            <div className="report-detail__location-block">
              <h3 className="report-detail__section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Ubicación
              </h3>
              {report.location.address && (
                <p className="report-detail__address">{report.location.address}</p>
              )}
              <MapPicker value={report.location} readOnly height="280px" />
            </div>
          )}

          {/* Acciones: votar + estado + duplicado + eliminar */}
          <div className="report-detail__footer">
            <button className="report-detail__share-btn" onClick={handleShare}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Compartir
            </button>

            {currentUser && !isOwner && !isAdmin && (
              <button
                className={`report-detail__seguir-btn ${siguiendo ? "report-detail__seguir-btn--active" : ""}`}
                onClick={handleToggleSeguir}
                disabled={loadingSeguir}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={siguiendo ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {siguiendo ? "Siguiendo" : "Seguir"}
              </button>
            )}
            <div className="report-detail__vote-block">
              <button
                className={`report-detail__vote-btn ${hasVoted ? "report-detail__vote-btn--active" : ""}`}
                onClick={handleVote}
                disabled={!canVote}
                title={report.status !== "pendiente" ? "Solo se puede votar reportes pendientes" : ""}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={hasVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
                <span>{report.votes.length} {report.votes.length === 1 ? "apoyo" : "apoyos"}</span>
              </button>
              {!currentUser && <span className="report-detail__vote-hint">Iniciá sesión para votar</span>}
              {currentUser && report.status !== "pendiente" && (
                <span className="report-detail__vote-hint">Solo se vota en reportes pendientes</span>
              )}
            </div>

            <div className="report-detail__manage">
              {canChangeStatus && (
                <select
                  className="report-detail__status-select"
                  value={report.status}
                  onChange={handleStatusChange}
                  style={{ borderColor: statusInfo.color, color: statusInfo.color }}
                >
                  {STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              )}

              {!isOwner && currentUser && report.status !== "duplicado" && (
                <button className="report-detail__duplicate-btn" onClick={handleMarkDuplicate}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Duplicado
                </button>
              )}

              {isAdmin && report.status === "pendiente" && (
                <button className="report-detail__verificar-btn" onClick={() => setModalVerificar(true)}>
                  🔍 Enviar a verificación
                </button>
              )}

              {isAdmin && report.status !== "cancelado" && report.status !== "resuelto" && (
                <button className="report-detail__cancel-btn" onClick={() => setModalCancelar(true)}>
                  ❌ Cancelar reporte
                </button>
              )}

              {isOwner && isPendiente && (
                <button className="report-detail__delete-btn" onClick={handleDelete}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>

        {report.photo && (
          <div className="report-detail__photo">
            <img
              src={report.photo}
              alt={report.title}
              onError={(e) => { e.target.parentElement.style.display = 'none'; }}
            />
          </div>
        )}

        {/* Historial simplificado — visible para todos */}
        <div className="report-detail__historial">
          <h2 className="report-detail__comments-title">Seguimiento del reporte</h2>
          <div className="report-detail__historial-list">
            {historialSimplificado().map((item, i, arr) => (
              <div key={i} className="historial-item">
                <div className="historial-item__icon-col">
                  <span className="historial-item__icon">{item.icon}</span>
                  {i < arr.length - 1 && <span className="historial-item__connector" />}
                </div>
                <div className="historial-item__content">
                  <span className="historial-item__texto">{item.texto}</span>
                  <span className="historial-item__meta">{formatDateShort(item.fecha)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fotos de campo y resolución */}
        {(report.fotoCampo || report.fotoResolucion) && (
          <div className="report-detail__fotos">
            {report.fotoCampo && (
              <div className="report-detail__foto-bloque">
                <h3 className="report-detail__foto-label">📸 Estado antes de la intervención</h3>
                <img src={report.fotoCampo} alt="Estado campo" className="report-detail__foto-img" />
              </div>
            )}
            {report.fotoResolucion && (
              <div className="report-detail__foto-bloque">
                <h3 className="report-detail__foto-label">✅ Cómo quedó resuelto</h3>
                <img src={report.fotoResolucion} alt="Resolución" className="report-detail__foto-img" />
              </div>
            )}
          </div>
        )}

        {/* Diario de avances (solo admin) */}
        {isAdmin && avances.length > 0 && (
          <div className="report-detail__avances">
            <h2 className="report-detail__comments-title">
              Diario de trabajo
              <span className="report-detail__comments-count">{avances.length} jornada{avances.length !== 1 ? "s" : ""}</span>
            </h2>
            <div className="avances-list">
              {avances.map((a, i) => (
                <div key={a.id} className="avance-item">
                  <div className="avance-item__dot" />
                  {i < avances.length - 1 && <div className="avance-item__line" />}
                  <div className="avance-item__content">
                    <div className="avance-item__header">
                      <span className="avance-item__empleado">{a.empleado_nombre}</span>
                      <span className="avance-item__fecha">{formatDateShort(a.creado_en)}</span>
                    </div>
                    <p className="avance-item__desc">{a.descripcion}</p>
                    {a.porcentaje != null && (
                      <div className="avance-item__barra-wrap">
                        <div className="avance-item__barra" style={{ width: `${a.porcentaje}%` }} />
                        <span className="avance-item__pct">{a.porcentaje}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Novedades (solo admin) */}
        {isAdmin && novedades.length > 0 && (
          <div className="report-detail__novedades">
            <h2 className="report-detail__comments-title">
              Novedades del empleado
              <span className="report-detail__comments-count">{novedades.length}</span>
            </h2>
            <div className="novedades-list">
              {novedades.map((n) => (
                <div key={n.id} className={`novedad-item ${n.tipo === "bloqueante" ? "novedad-item--bloqueante" : "novedad-item--informativa"}`}>
                  <div className="novedad-item__header">
                    <span className="novedad-item__tipo">
                      {n.tipo === "bloqueante" ? "🚨 Bloqueante" : "📝 Informativa"}
                    </span>
                    <span className="novedad-item__meta">
                      {n.empleado_nombre} · {formatDateShort(n.creado_en)}
                    </span>
                  </div>
                  <p className="novedad-item__desc">{n.descripcion}</p>
                  {n.foto && <img src={n.foto} alt="novedad" className="novedad-item__foto" />}

                  {n.respuesta_admin ? (
                    <div className="novedad-item__respuesta">
                      <p className="novedad-item__respuesta-label">✅ Respuesta del admin:</p>
                      <p className="novedad-item__respuesta-texto">{n.respuesta_admin}</p>
                      <span className="novedad-item__respuesta-meta">{n.respondido_por_nombre} · {formatDateShort(n.respondido_en)}</span>
                    </div>
                  ) : (
                    <div className="novedad-item__reply">
                      <input
                        className="novedad-item__reply-input"
                        placeholder="Escribí tu respuesta al empleado..."
                        value={respuestas[n.id] || ""}
                        onChange={(e) => setRespuestas((prev) => ({ ...prev, [n.id]: e.target.value }))}
                      />
                      <button
                        className="novedad-item__reply-btn"
                        onClick={() => handleResponderNovedad(n.id)}
                        disabled={!respuestas[n.id]?.trim()}
                      >
                        Responder
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Panel de asignación (solo admin) */}
        {isAdmin && (
          <div className="report-detail__asignacion">
            <h2 className="report-detail__comments-title">Equipo asignado</h2>

            {/* Formulario para asignar/reasignar */}
            {report.status !== "resuelto" && report.status !== "cancelado" && (
              <div className="asignacion-form">
                <div className="asignacion-form__row">
                  <div className="asignacion-form__field">
                    <span className="asignacion-form__field-label">👤 Líder</span>
                    <select
                      className="asignacion-form__select"
                      value={empleadoSeleccionado}
                      onChange={(e) => {
                        setEmpleadoSeleccionado(e.target.value);
                        setMiembrosSeleccionados((prev) => prev.filter((m) => m !== e.target.value));
                      }}
                    >
                      <option value="">Seleccioná el líder...</option>
                      {[...empleados]
                        .sort((a, b) => {
                          const esp = CATEGORIA_ESPECIALIDAD[report.category];
                          const aMatch = esp && a.especialidades?.includes(esp);
                          const bMatch = esp && b.especialidades?.includes(esp);
                          if (aMatch && !bMatch) return -1;
                          if (!aMatch && bMatch) return 1;
                          return 0;
                        })
                        .map((e) => {
                          const esp = CATEGORIA_ESPECIALIDAD[report.category];
                          const match = esp && e.especialidades?.includes(esp);
                          const espLabels = e.especialidades?.map((id) => ESPECIALIDADES.find((x) => x.id === id)?.icon).filter(Boolean).join(' ') || '';
                          return (
                            <option key={e.id} value={e.id}>
                              {match ? '⭐ ' : ''}{e.name} (@{e.username}){espLabels ? ` — ${espLabels}` : ''}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                  <div className="asignacion-form__field">
                    <span className="asignacion-form__field-label">⚡ Prioridad</span>
                    <select
                      className="asignacion-form__select asignacion-form__select--prioridad"
                      value={prioridadSeleccionada}
                      onChange={(e) => setPrioridadSeleccionada(e.target.value)}
                    >
                      <option value="alta">🔺 Alta</option>
                      <option value="media">🔸 Media</option>
                      <option value="baja">🔹 Baja</option>
                    </select>
                  </div>
                  <div className="asignacion-form__field">
                    <span className="asignacion-form__field-label">📅 Fecha límite <span>(opcional)</span></span>
                    <input
                      type="date"
                      className="asignacion-form__date"
                      value={fechaLimite}
                      onChange={(e) => setFechaLimite(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                </div>

                {/* Selección de miembros */}
                {empleadoSeleccionado && (
                  <div className="asignacion-form__miembros">
                    <p className="asignacion-form__miembros-label">👥 Agregar miembros al equipo <span>(opcional)</span></p>
                    <div className="asignacion-form__miembros-list">
                      {[...empleados]
                        .filter((e) => e.id !== empleadoSeleccionado)
                        .sort((a, b) => {
                          const esp = CATEGORIA_ESPECIALIDAD[report.category];
                          const aMatch = esp && a.especialidades?.includes(esp);
                          const bMatch = esp && b.especialidades?.includes(esp);
                          if (aMatch && !bMatch) return -1;
                          if (!aMatch && bMatch) return 1;
                          return 0;
                        })
                        .map((e) => {
                          const esp = CATEGORIA_ESPECIALIDAD[report.category];
                          const match = esp && e.especialidades?.includes(esp);
                          return (
                            <label key={e.id} className={`asignacion-form__miembro-check ${match ? "asignacion-form__miembro-check--match" : ""}`}>
                              <input
                                type="checkbox"
                                checked={miembrosSeleccionados.includes(e.id)}
                                onChange={() => toggleMiembro(e.id)}
                              />
                              <UserAvatar avatar={e.avatar} size="xs" />
                              <span>{e.name}</span>
                              {e.especialidades?.length > 0 && (
                                <span className="asignacion-form__miembro-esps">
                                  {e.especialidades.map((id) => ESPECIALIDADES.find((x) => x.id === id)?.icon).filter(Boolean).join(' ')}
                                </span>
                              )}
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}

                <button
                  className="asignacion-form__btn"
                  onClick={handleAsignar}
                  disabled={!empleadoSeleccionado || loadingAsignar}
                >
                  {asignaciones.length > 0 ? "Reasignar equipo" : "Asignar equipo"}
                </button>
              </div>
            )}

            {/* Equipo actual */}
            {asignaciones.length > 0 && (() => {
              const matchEsp = CATEGORIA_ESPECIALIDAD[report?.category] ?? null;
              return (
              <div className="asignacion-actual">
                {asignaciones.filter((a) => a.aprobado === 'aprobado').map((a) => {
                  const isExp = !!expandidosEquipo[a.empleado_id];
                  const espObj = matchEsp ? ESPECIALIDADES.find((x) => x.id === matchEsp) : null;
                  const tieneEsps = a.especialidades?.length > 0;
                  return (
                    <div
                      key={a.id}
                      className="asignacion-actual__item"
                      onClick={() => navigate(`/perfil-empleado/${a.empleado_id}`)}
                    >
                      <div className="asignacion-actual__row">
                        <UserAvatar avatar={a.empleado_avatar} size="sm" />
                        <div className="asignacion-actual__info">
                          <p className="asignacion-actual__nombre">{a.empleado_nombre}</p>
                          <span className={`asignacion-actual__rol ${a.es_lider ? "asignacion-actual__rol--lider" : "asignacion-actual__rol--miembro"}`}>
                            {a.es_lider ? "👑 Líder" : "👤 Miembro"}
                          </span>
                        </div>
                        {!isExp && espObj && a.especialidades?.includes(matchEsp) && (
                          <span className="asignacion-actual__esp-hint" title={espObj.label}>{espObj.icon}</span>
                        )}
                        {tieneEsps && (
                          <button
                            className="asignacion-actual__toggle"
                            onClick={(e) => { e.stopPropagation(); setExpandidosEquipo((prev) => ({ ...prev, [a.empleado_id]: !prev[a.empleado_id] })); }}
                            title={isExp ? "Ocultar especialidades" : "Ver especialidades"}
                          >
                            {isExp ? "▲" : "▼"}
                          </button>
                        )}
                      </div>
                      {isExp && (
                        <div className="asignacion-actual__esps">
                          {a.especialidades.map((espId) => {
                            const esp = ESPECIALIDADES.find((x) => x.id === espId);
                            return esp ? (
                              <span
                                key={espId}
                                className={`asignacion-actual__esp-badge${espId === matchEsp ? " asignacion-actual__esp-badge--match" : ""}`}
                              >
                                {esp.icon} {esp.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {asignaciones.some((a) => a.aprobado === 'pendiente' || a.aprobado === 'baja_pendiente') && (
                  <div className="asignacion-propuestas">
                    <p className="asignacion-propuestas__titulo">⏳ Propuestas del líder</p>
                    {asignaciones.filter((a) => a.aprobado === 'pendiente' || a.aprobado === 'baja_pendiente').map((a) => (
                      <div key={a.id} className={`asignacion-propuestas__item asignacion-propuestas__item--${a.aprobado === 'pendiente' ? 'agregar' : 'quitar'}`}>
                        <UserAvatar avatar={a.empleado_avatar} size="sm" />
                        <div className="asignacion-actual__info">
                          <p className="asignacion-actual__nombre">{a.empleado_nombre}</p>
                          <span className="asignacion-propuestas__tipo">
                            {a.aprobado === 'pendiente' ? '➕ Propone agregar' : '➖ Propone quitar'}
                          </span>
                        </div>
                        <div className="asignacion-propuestas__actions">
                          <button className="asignacion-propuestas__btn asignacion-propuestas__btn--aprobar" onClick={() => handleResolverPropuesta(a.empleado_id, 'aprobar')}>
                            ✅ Aprobar
                          </button>
                          <button className="asignacion-propuestas__btn asignacion-propuestas__btn--rechazar" onClick={() => handleResolverPropuesta(a.empleado_id, 'rechazar')}>
                            ❌ Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ); })()}

            {/* Equipos anteriores */}
            {historialEquipos.length > 0 && (
              <div className="asignacion-historial">
                <button
                  className="asignacion-historial__toggle"
                  onClick={() => setShowHistorialEquipos((v) => !v)}
                >
                  🕓 Equipos anteriores ({new Set(historialEquipos.map((h) => h.asignado_en.slice(0, 10))).size})
                  <span>{showHistorialEquipos ? " ▲" : " ▼"}</span>
                </button>
                {showHistorialEquipos && (() => {
                  const grupos = [];
                  const vistas = new Set();
                  historialEquipos.forEach((h) => {
                    const dia = h.asignado_en.slice(0, 10);
                    if (!vistas.has(dia)) { vistas.add(dia); grupos.push(dia); }
                  });
                  return grupos.map((dia) => {
                    const miembros = historialEquipos.filter((h) => h.asignado_en.slice(0, 10) === dia);
                    return (
                      <div key={dia} className="asignacion-historial__grupo">
                        <p className="asignacion-historial__fecha">
                          Asignado el {new Date(dia).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                        <div className="asignacion-historial__miembros">
                          {miembros.map((h, i) => (
                            <div key={i} className="asignacion-historial__item">
                              <UserAvatar avatar={h.empleado_avatar} size="sm" />
                              <div>
                                <p className="asignacion-historial__nombre">{h.empleado_nombre}</p>
                                <span className={`asignacion-historial__rol ${h.es_lider ? "asignacion-historial__rol--lider" : ""}`}>
                                  {h.es_lider ? "👑 Líder" : "👤 Miembro"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* Validación de cierre */}
            {report.estadoInterno === "pendiente_validacion" && (
              <div className="asignacion-validacion">
                <p className="asignacion-validacion__aviso">
                  ⚠️ El empleado propuso cerrar este reporte. Revisá la foto de resolución y validá o rechazá el cierre.
                </p>
                <div className="asignacion-validacion__actions">
                  <button className="asignacion-validacion__btn--validar" onClick={handleValidarCierre}>
                    ✅ Validar cierre
                  </button>
                  <div className="asignacion-validacion__rechazo">
                    <input
                      className="asignacion-validacion__input"
                      placeholder="Motivo del rechazo (opcional)"
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                    />
                    <button className="asignacion-validacion__btn--rechazar" onClick={handleRechazarCierre}>
                      ❌ Rechazar cierre
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sección de comentarios */}
        <div className="report-detail__comments">
          <h2 className="report-detail__comments-title">
            Comentarios
            <span className="report-detail__comments-count">{report.comments?.length ?? 0}</span>
          </h2>

          {currentUser && currentUser.role !== "empleado" && (
            <form className="report-detail__comment-form" onSubmit={handleAddComment}>
              <div className="report-detail__comment-input-row">
                <UserAvatar avatar={currentUser.avatar} size="sm" />
                <input
                  className="report-detail__comment-input"
                  placeholder="Escribí un comentario..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={400}
                />
                <button
                  className="report-detail__comment-submit"
                  type="submit"
                  disabled={!commentText.trim()}
                >
                  Enviar
                </button>
              </div>
            </form>
          )}

          <div className="report-detail__comment-list">
            {(!report.comments || report.comments.length === 0) ? (
              <p className="report-detail__no-comments">Todavía no hay comentarios. ¡Sé el primero!</p>
            ) : (
              report.comments.map((comment) => (
                <div key={comment.id} className={`comment ${comment.esOficial ? "comment--oficial" : ""}`}>
                  <div className={`comment__avatar ${comment.esOficial ? "comment__avatar--oficial" : ""}`}>
                    {comment.authorName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="comment__body">
                    <div className="comment__header">
                      <span className="comment__author">{comment.authorName}</span>
                      {!!comment.esOficial && (
                        <span className="comment__badge-oficial">
                          🏛️ Respuesta oficial
                        </span>
                      )}
                      <span className="comment__date">{formatDateShort(comment.createdAt)}</span>
                    </div>
                    <p className="comment__text">{comment.text}</p>
                  </div>
                  {(currentUser?.id === comment.authorId || isAdmin) && (
                    <button
                      className="comment__delete"
                      onClick={() => handleDeleteComment(comment.id)}
                      title="Eliminar comentario"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal: enviar a verificación */}
      {modalVerificar && (
        <div className="report-detail__modal-bg" onClick={(e) => e.target === e.currentTarget && setModalVerificar(false)}>
          <div className="report-detail__modal-cancelar">
            <h3 className="report-detail__modal-cancelar-titulo" style={{ color: "#8b5cf6" }}>🔍 Enviar a verificación</h3>
            <p className="report-detail__modal-cancelar-desc">
              Se asignará un empleado para constatar el problema en campo antes de asignar el equipo definitivo.
            </p>
            <div>
              <label className="report-detail__verificar-label">Empleado verificador</label>
              <select
                className="report-detail__verificar-select"
                value={verificadorSeleccionado}
                onChange={(e) => setVerificadorSeleccionado(e.target.value)}
              >
                <option value="">Seleccioná un empleado...</option>
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} (@{e.username})</option>
                ))}
              </select>
            </div>
            <div className="report-detail__cancelar-acciones">
              <button
                className="report-detail__cancelar-btn-volver"
                onClick={() => { setModalVerificar(false); setVerificadorSeleccionado(""); }}
              >
                Volver
              </button>
              <button
                className="report-detail__verificar-btn-confirmar"
                onClick={handleEnviarVerificacion}
                disabled={!verificadorSeleccionado || loadingVerificar}
              >
                {loadingVerificar ? "Enviando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: cancelar reporte */}
      {modalCancelar && (
        <div className="report-detail__modal-bg" onClick={(e) => e.target === e.currentTarget && setModalCancelar(false)}>
          <div className="report-detail__modal-cancelar">
            <h3 className="report-detail__modal-cancelar-titulo">❌ Cancelar reporte</h3>
            <p className="report-detail__modal-cancelar-desc">
              Esta acción es definitiva. El vecino recibirá una notificación con el motivo.
            </p>

            <div className="report-detail__cancelar-opciones">
              {[
                { id: "fuera_jurisdiccion",   label: "Fuera de jurisdicción municipal", desc: "Le corresponde a otra entidad (empresa de agua, luz, provincia)" },
                { id: "problema_inexistente", label: "El problema ya no existe",         desc: "Cuando llegaron, el inconveniente ya había desaparecido" },
                { id: "acceso_denegado",      label: "Acceso al lugar denegado",         desc: "No se puede ingresar al lugar (propiedad privada, zona restringida)" },
                { id: "sin_recursos",         label: "Sin recursos disponibles",         desc: "El municipio no cuenta con presupuesto o materiales en este momento" },
                { id: "duplicado",            label: "Reporte duplicado",                desc: "Ya existe otro reporte para el mismo problema" },
              ].map((op) => (
                <label
                  key={op.id}
                  className={`report-detail__cancelar-opcion${motivoCancelacion === op.id ? " report-detail__cancelar-opcion--active" : ""}`}
                >
                  <input
                    type="radio"
                    name="motivo"
                    value={op.id}
                    checked={motivoCancelacion === op.id}
                    onChange={() => setMotivoCancelacion(op.id)}
                  />
                  <div>
                    <span className="report-detail__cancelar-opcion-label">{op.label}</span>
                    <span className="report-detail__cancelar-opcion-desc">{op.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="report-detail__cancelar-acciones">
              <button
                className="report-detail__cancelar-btn-volver"
                onClick={() => { setModalCancelar(false); setMotivoCancelacion(""); }}
              >
                Volver
              </button>
              <button
                className="report-detail__cancelar-btn-confirmar"
                onClick={handleCancelar}
                disabled={!motivoCancelacion || loadingCancelar}
              >
                {loadingCancelar ? "Cancelando..." : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
