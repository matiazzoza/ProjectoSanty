import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ESPECIALIDADES, CATEGORIA_ESPECIALIDAD } from "../../data/especialidades";
import { useAuth } from "../../controllers/AuthController";
import { useToast } from "../../controllers/ToastController";
import { getMisAsignaciones, getMisNovedades, getMisAvances, marcarEnEjecucion, proponerCierre, getEmpleadosDisponibles, getMiEquipo, proponerMiembro, proponerBaja } from "../../models/asignacionModel";
import { getMisVerificaciones, verificarReporte } from "../../models/reporteModel";
import { cargarNovedad } from "../../models/novedadModel";
import { registrarAvance } from "../../models/avanceModel";
import { enviarMensaje, getMisMensajes } from "../../models/mensajeAdminModel";
import { CATEGORIES } from "../../data/mockReports";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import "./PanelEmpleado.scss";

const ESTADOS_INTERNOS = {
  asignado:             { label: "Asignado",              color: "#3b82f6", bg: "#eff6ff" },
  bloqueado:            { label: "Bloqueado",             color: "#ef4444", bg: "#fef2f2" },
  en_ejecucion:         { label: "En ejecución",          color: "#f59e0b", bg: "#fffbeb" },
  pendiente_validacion: { label: "Esperando validación",  color: "#8b5cf6", bg: "#f5f3ff" },
  resuelto:             { label: "Resuelto",              color: "#22c55e", bg: "#f0fdf4" },
};

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PanelEmpleado() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [expandidos, setExpandidos] = useState({});
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [misNovedades, setMisNovedades] = useState([]);
  const [misAvances, setMisAvances] = useState([]);
  const [activeTab, setActiveTab] = useState("reportes"); // 'reportes' | 'verificaciones' | 'novedades' | 'avances' | 'mensajes'
  const [misVerificaciones, setMisVerificaciones] = useState([]);
  const [modalVerificacion, setModalVerificacion] = useState(null); // reporte a verificar
  const [verResultado, setVerResultado] = useState("");
  const [verFoto, setVerFoto] = useState(null);
  const [verFotoPreview, setVerFotoPreview] = useState(null);
  const [verNota, setVerNota] = useState("");
  const [loadingVer, setLoadingVer] = useState(false);
  const [misMensajes, setMisMensajes] = useState([]);
  const [mensajeTexto, setMensajeTexto] = useState("");
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const [mensajeTipo, setMensajeTipo] = useState("general");
  const [mensajeReporteId, setMensajeReporteId] = useState("");
  const [mensajeContexto, setMensajeContexto] = useState("");
  const [confirmarEnvioReporte, setConfirmarEnvioReporte] = useState(false);

  // Modal en ejecución
  const [modalEjecucion, setModalEjecucion] = useState(null);
  const [fotoCampo, setFotoCampo] = useState(null);
  const [fotoCampoPreview, setFotoCampoPreview] = useState(null);
  const [loadingEjecucion, setLoadingEjecucion] = useState(false);

  // Modal avance
  const [modalAvance, setModalAvance] = useState(null);
  const [avanceDesc, setAvanceDesc] = useState("");
  const [avancePct, setAvancePct] = useState("");
  const [loadingAvance, setLoadingAvance] = useState(false);

  // Modal novedad
  const [modalNovedad, setModalNovedad] = useState(null);
  const [novedadTipo, setNovedadTipo] = useState("informativa");
  const [novedadDesc, setNovedadDesc] = useState("");
  const [novedadFoto, setNovedadFoto] = useState(null);
  const [novedadFotoPreview, setNovedadFotoPreview] = useState(null);
  const [loadingNovedad, setLoadingNovedad] = useState(false);

  // Modal cierre
  const [modalCierre, setModalCierre] = useState(null);
  const [fotoResolucion, setFotoResolucion] = useState(null);
  const [fotoResolucionPreview, setFotoResolucionPreview] = useState(null);
  const [loadingCierre, setLoadingCierre] = useState(false);

  // Modal equipo
  const [modalEquipo, setModalEquipo] = useState(null); // { reporte_id, title }
  const [equipo, setEquipo] = useState([]);
  const [todosEmpleados, setTodosEmpleados] = useState([]);
  const [empleadoAgregar, setEmpleadoAgregar] = useState("");
  const [loadingEquipo, setLoadingEquipo] = useState(false);

  useEffect(() => {
    getMisAsignaciones()
      .then(setAsignaciones)
      .catch(() => addToast("Error cargando asignaciones", "error"))
      .finally(() => setLoading(false));
    getMisNovedades().then(setMisNovedades).catch(() => {});
    getMisAvances().then(setMisAvances).catch(() => {});
    getMisMensajes().then(setMisMensajes).catch(() => {});
    getEmpleadosDisponibles().then(setTodosEmpleados).catch(() => {});
    getMisVerificaciones().then(setMisVerificaciones).catch(() => {});
  }, []);

  async function abrirModalEquipo(a) {
    setModalEquipo(a);
    setLoadingEquipo(true);
    try {
      const data = await getMiEquipo(a.reporte_id);
      setEquipo(data);
    } catch {
      addToast("Error cargando equipo", "error");
    } finally {
      setLoadingEquipo(false);
    }
  }

  async function handleProponerMiembro() {
    if (!empleadoAgregar) return;
    try {
      await proponerMiembro(modalEquipo.reporte_id, empleadoAgregar);
      const data = await getMiEquipo(modalEquipo.reporte_id);
      setEquipo(data);
      setEmpleadoAgregar("");
      addToast("Propuesta enviada al admin", "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  async function handleProponerBaja(empleadoId) {
    try {
      await proponerBaja(modalEquipo.reporte_id, empleadoId);
      const data = await getMiEquipo(modalEquipo.reporte_id);
      setEquipo(data);
      addToast("Propuesta de baja enviada al admin", "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  async function handleFotoVerificacion(e) {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await toBase64(file);
    setVerFoto(base64);
    setVerFotoPreview(base64);
  }

  async function confirmarVerificacion() {
    if (!verResultado) return;
    setLoadingVer(true);
    try {
      await verificarReporte(modalVerificacion.id, verResultado, verFoto, verNota.trim() || null);
      setMisVerificaciones((prev) => prev.filter((r) => r.id !== modalVerificacion.id));
      addToast("Verificación enviada. El admin fue notificado.", "success");
      setModalVerificacion(null);
      setVerResultado("");
      setVerFoto(null);
      setVerFotoPreview(null);
      setVerNota("");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoadingVer(false);
    }
  }

  async function handleFotoCampo(e) {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await toBase64(file);
    setFotoCampo(base64);
    setFotoCampoPreview(base64);
  }

  async function handleFotoResolucion(e) {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await toBase64(file);
    setFotoResolucion(base64);
    setFotoResolucionPreview(base64);
  }

  async function handleFotoNovedad(e) {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await toBase64(file);
    setNovedadFoto(base64);
    setNovedadFotoPreview(base64);
  }

  async function confirmarAvance() {
    if (!avanceDesc.trim()) return;
    setLoadingAvance(true);
    try {
      const pct = avancePct !== "" ? Number(avancePct) : null;
      await registrarAvance(modalAvance.reporte_id, {
        descripcion: avanceDesc.trim(),
        porcentaje: pct,
      });
      // Actualizar ultimoPorcentaje en el estado local
      if (pct !== null) {
        setAsignaciones((prev) =>
          prev.map((a) =>
            a.reporte_id === modalAvance.reporte_id ? { ...a, ultimoPorcentaje: pct } : a
          )
        );
      }
      addToast("Avance registrado correctamente", "success");
      setModalAvance(null);
      setAvanceDesc("");
      setAvancePct("");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoadingAvance(false);
    }
  }

  async function confirmarNovedad() {
    if (!novedadDesc.trim()) return;
    setLoadingNovedad(true);
    try {
      await cargarNovedad(modalNovedad.reporte_id, {
        tipo: novedadTipo,
        descripcion: novedadDesc.trim(),
        foto: novedadFoto,
      });
      if (novedadTipo === "bloqueante") {
        setAsignaciones((prev) =>
          prev.map((a) => a.reporte_id === modalNovedad.reporte_id ? { ...a, estadoInterno: "bloqueado" } : a)
        );
      }
      addToast("Novedad registrada. El admin fue notificado.", "success");
      setModalNovedad(null);
      setNovedadTipo("informativa");
      setNovedadDesc("");
      setNovedadFoto(null);
      setNovedadFotoPreview(null);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoadingNovedad(false);
    }
  }

  async function confirmarEjecucion() {
    if (!modalEjecucion.foto && !fotoCampo) {
      addToast("Este reporte no tiene foto inicial. Debés subir una foto del estado actual.", "error");
      return;
    }
    setLoadingEjecucion(true);
    try {
      await marcarEnEjecucion(modalEjecucion.reporte_id, fotoCampo);
      setAsignaciones((prev) =>
        prev.map((a) =>
          a.reporte_id === modalEjecucion.reporte_id
            ? { ...a, estadoInterno: "en_ejecucion", fotoCampo: fotoCampo ?? a.fotoCampo }
            : a
        )
      );
      addToast("Reporte marcado como en ejecución", "success");
      setModalEjecucion(null);
      setFotoCampo(null);
      setFotoCampoPreview(null);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoadingEjecucion(false);
    }
  }

  async function confirmarCierre() {
    if (!fotoResolucion) {
      addToast("La foto de resolución es obligatoria", "error");
      return;
    }
    setLoadingCierre(true);
    try {
      await proponerCierre(modalCierre.reporte_id, fotoResolucion);
      setAsignaciones((prev) =>
        prev.map((a) =>
          a.reporte_id === modalCierre.reporte_id
            ? { ...a, estadoInterno: "pendiente_validacion", fotoResolucion }
            : a
        )
      );
      addToast("Cierre propuesto. Esperando validación del admin.", "success");
      setModalCierre(null);
      setFotoResolucion(null);
      setFotoResolucionPreview(null);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoadingCierre(false);
    }
  }

  function resetMensajeForm() {
    setMensajeTexto("");
    setMensajeTipo("general");
    setMensajeReporteId("");
    setMensajeContexto("");
    setConfirmarEnvioReporte(false);
  }

  function seleccionarTipo(tipo) {
    setMensajeTipo(tipo);
    setMensajeReporteId("");
    setMensajeContexto("");
    setConfirmarEnvioReporte(false);
  }

  function seleccionarContexto(ctx) {
    setMensajeContexto(ctx);
    setConfirmarEnvioReporte(false);
  }

  async function handleEnviarMensaje(e) {
    e.preventDefault();
    if (!mensajeTexto.trim()) return;
    setEnviandoMensaje(true);
    try {
      const reporteIdFinal = mensajeTipo === "reporte" ? mensajeReporteId : null;
      const contextoFinal  = mensajeTipo === "reporte" ? mensajeContexto  : null;
      const nuevo = await enviarMensaje(mensajeTexto.trim(), reporteIdFinal, contextoFinal);
      setMisMensajes((prev) => [nuevo, ...prev]);
      resetMensajeForm();
      addToast("Mensaje enviado al admin", "success");
    } catch (err) {
      addToast(err.message || "Error al enviar el mensaje", "error");
    } finally {
      setEnviandoMensaje(false);
    }
  }

  const canShowMensajeForm =
    mensajeTipo === "general" ||
    (mensajeTipo === "reporte" && mensajeReporteId && mensajeContexto &&
      (mensajeContexto !== "reporte" || confirmarEnvioReporte));

  const pendientes  = asignaciones.filter((a) => a.estadoInterno === "asignado");
  const enCurso     = asignaciones.filter((a) => a.estadoInterno === "en_ejecucion" || a.estadoInterno === "pendiente_validacion" || a.estadoInterno === "bloqueado");

  if (loading) return <div className="panel-empleado__loading">Cargando asignaciones...</div>;

  return (
    <div className="panel-empleado">
      <div className="panel-empleado__container">

        <div className="panel-empleado__header">
          <div>
            <h1 className="panel-empleado__title">Mi panel</h1>
            <p className="panel-empleado__subtitle">Hola, <strong>{currentUser.name}</strong> — tus reportes asignados</p>
          </div>
          <div className="panel-empleado__stats">
            <div className="panel-empleado__stat"><span>{pendientes.length}</span>Pendientes</div>
            <div className="panel-empleado__stat"><span>{enCurso.length}</span>En curso</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="panel-empleado__tabs">
          <button className={`panel-empleado__tab ${activeTab === "reportes" ? "panel-empleado__tab--active" : ""}`} onClick={() => setActiveTab("reportes")}>
            📋 Reportes
            <span className="panel-empleado__tab-count">{pendientes.length + enCurso.length}</span>
          </button>
          {misVerificaciones.length > 0 && (
            <button className={`panel-empleado__tab ${activeTab === "verificaciones" ? "panel-empleado__tab--active" : ""}`} onClick={() => setActiveTab("verificaciones")}>
              🔍 Verificaciones
              <span className="panel-empleado__tab-count">{misVerificaciones.length}</span>
            </button>
          )}
          <button className={`panel-empleado__tab ${activeTab === "novedades" ? "panel-empleado__tab--active" : ""}`} onClick={() => setActiveTab("novedades")}>
            ⚠️ Mis novedades
            <span className="panel-empleado__tab-count">{misNovedades.length}</span>
          </button>
          <button className={`panel-empleado__tab ${activeTab === "avances" ? "panel-empleado__tab--active" : ""}`} onClick={() => setActiveTab("avances")}>
            📊 Mis avances
            <span className="panel-empleado__tab-count">{misAvances.length}</span>
          </button>
          <button className={`panel-empleado__tab ${activeTab === "mensajes" ? "panel-empleado__tab--active" : ""}`} onClick={() => setActiveTab("mensajes")}>
            ✉️ Mensajes al admin
            <span className="panel-empleado__tab-count">{misMensajes.length}</span>
          </button>
        </div>

        {/* Tab: Reportes */}
        {activeTab === "reportes" && (
          asignaciones.length === 0 ? (
            <div className="panel-empleado__empty">
              <p>No tenés reportes asignados aún.</p>
            </div>
          ) : (
            <>
              {pendientes.length > 0 && (
                <section className="panel-empleado__section">
                  <h2 className="panel-empleado__section-title">📋 Pendientes de iniciar</h2>
                  <div className="panel-empleado__grid">
                    {pendientes.map((a) => <TarjetaReporte key={a.reporte_id} a={a} onEjecucion={a.es_lider ? () => setModalEjecucion(a) : null} onEquipo={() => abrirModalEquipo(a)} />)}
                  </div>
                </section>
              )}
              {enCurso.length > 0 && (
                <section className="panel-empleado__section">
                  <h2 className="panel-empleado__section-title">🔧 En curso</h2>
                  <div className="panel-empleado__grid">
                    {enCurso.map((a) => (
                      <TarjetaReporte
                        key={a.reporte_id}
                        a={a}
                        onCierre={a.estadoInterno === "en_ejecucion" ? () => setModalCierre(a) : null}
                        onNovedad={a.estadoInterno !== "pendiente_validacion" ? () => setModalNovedad(a) : null}
                        onAvance={a.estadoInterno === "en_ejecucion" ? () => { setModalAvance(a); setAvancePct(a.ultimoPorcentaje ?? 0); } : null}
                        onEquipo={() => abrirModalEquipo(a)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )
        )}

        {/* Tab: Verificaciones */}
        {activeTab === "verificaciones" && (
          <section className="panel-empleado__section">
            <p className="panel-empleado__ver-aviso">
              🔍 El admin te asignó verificar estos reportes en campo. Confirmá o desmentí el problema y subí una foto.
            </p>
            <div className="panel-empleado__ver-lista">
              {misVerificaciones.map((r) => {
                const cat = CATEGORIES.find((c) => c.id === r.category);
                return (
                  <div key={r.id} className="panel-empleado__ver-item">
                    <div className="panel-empleado__ver-info">
                      {cat && <span className="panel-empleado__ver-cat">{cat.icon} {cat.label}</span>}
                      <p className="panel-empleado__ver-title">{r.title}</p>
                      {r.location?.address && <p className="panel-empleado__ver-dir">📍 {r.location.address}</p>}
                      {r.barrio && <p className="panel-empleado__ver-barrio">{r.barrio.nombre}</p>}
                    </div>
                    <div className="panel-empleado__ver-acciones">
                      <Link to={`/reporte/${r.id}`} className="panel-empleado__ver-link">Ver reporte</Link>
                      <button
                        className="panel-empleado__ver-btn"
                        onClick={() => setModalVerificacion(r)}
                      >
                        Registrar verificación
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tab: Mis novedades */}
        {activeTab === "novedades" && (
          <section className="panel-empleado__section">
            {misNovedades.length === 0 ? (
              <div className="panel-empleado__empty"><p>No registraste novedades aún.</p></div>
            ) : (
              <div className="panel-empleado__novedades-list">
                {misNovedades.map((n) => (
                  <Link key={n.id} to={`/reporte/${n.reporte_id}`} className={`panel-empleado__novedad-item panel-empleado__novedad-item--${n.tipo} panel-empleado__novedad-item--link`}>
                    <div className="panel-empleado__novedad-header">
                      <span className="panel-empleado__novedad-tipo">
                        {n.tipo === "bloqueante" ? "🚨 Bloqueante" : "📝 Informativa"}
                      </span>
                      <span className="panel-empleado__novedad-reporte">{n.reporteTitulo}</span>
                      <span className="panel-empleado__novedad-fecha">{new Date(n.creadoEn).toLocaleDateString("es-AR")}</span>
                    </div>
                    <p className="panel-empleado__novedad-desc">{n.descripcion}</p>
                    {n.respuestaAdmin ? (
                      <div className="panel-empleado__novedad-respuesta">
                        <span className="panel-empleado__novedad-respuesta-label">✅ El admin respondió:</span>
                        <p className="panel-empleado__novedad-respuesta-texto">{n.respuestaAdmin}</p>
                      </div>
                    ) : (
                      <p className="panel-empleado__novedad-pendiente">⏳ Sin respuesta del admin aún</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab: Mis avances */}
        {activeTab === "avances" && (
          <section className="panel-empleado__section">
            {misAvances.length === 0 ? (
              <div className="panel-empleado__empty"><p>No registraste avances aún.</p></div>
            ) : (
              <div className="panel-empleado__avances-list">
                {misAvances.map((av) => (
                  <Link
                    key={av.id}
                    to={`/reporte/${av.reporte_id}`}
                    className="panel-empleado__avance-item panel-empleado__avance-item--link"
                  >
                    <div className="panel-empleado__avance-header">
                      <span className="panel-empleado__avance-reporte">{av.reporteTitulo}</span>
                      <span className="panel-empleado__avance-fecha">{new Date(av.creadoEn).toLocaleDateString("es-AR")}</span>
                    </div>
                    <p className="panel-empleado__avance-desc">{av.descripcion}</p>
                    {av.porcentaje !== null && (
                      <div className="panel-empleado__avance-progreso">
                        <div className="panel-empleado__avance-barra-wrap">
                          <div className="panel-empleado__avance-barra" style={{ width: `${av.porcentaje}%` }} />
                        </div>
                        <span className="panel-empleado__avance-pct">{av.porcentaje}%</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab: Mensajes al admin */}
        {activeTab === "mensajes" && (
          <section className="panel-empleado__section">
            <div className="panel-empleado__mensaje-form">

              {/* Tipo de mensaje */}
              <p className="panel-empleado__modal-label">¿Sobre qué querés escribir?</p>
              <div className="panel-empleado__msg-tipo-group">
                <button
                  type="button"
                  className={`panel-empleado__msg-tipo-btn ${mensajeTipo === "general" ? "panel-empleado__msg-tipo-btn--active" : ""}`}
                  onClick={() => seleccionarTipo("general")}
                >
                  💬 General
                  <span>Cualquier consulta o comentario</span>
                </button>
                <button
                  type="button"
                  className={`panel-empleado__msg-tipo-btn ${mensajeTipo === "reporte" ? "panel-empleado__msg-tipo-btn--active" : ""}`}
                  onClick={() => seleccionarTipo("reporte")}
                >
                  📋 Sobre un reporte
                  <span>Vinculado a una de tus asignaciones</span>
                </button>
              </div>

              {/* Selector de reporte */}
              {mensajeTipo === "reporte" && (
                <>
                  <label className="panel-empleado__modal-label">Seleccioná el reporte</label>
                  <select
                    className="panel-empleado__modal-select"
                    value={mensajeReporteId}
                    onChange={(e) => { setMensajeReporteId(e.target.value); setMensajeContexto(""); setConfirmarEnvioReporte(false); }}
                  >
                    <option value="">Seleccioná un reporte...</option>
                    {asignaciones.map((a) => (
                      <option key={a.reporte_id} value={a.reporte_id}>{a.title}</option>
                    ))}
                  </select>

                  {/* Selector de contexto */}
                  {mensajeReporteId && (
                    <>
                      <label className="panel-empleado__modal-label">¿Sobre qué aspecto?</label>
                      <div className="panel-empleado__msg-contexto-group">
                        <button
                          type="button"
                          className={`panel-empleado__msg-contexto-btn ${mensajeContexto === "reporte" ? "panel-empleado__msg-contexto-btn--active" : ""}`}
                          onClick={() => seleccionarContexto("reporte")}
                        >
                          📋 El reporte
                          <span>Tarea, condiciones, materiales</span>
                        </button>
                        <button
                          type="button"
                          className={`panel-empleado__msg-contexto-btn ${mensajeContexto === "equipo" ? "panel-empleado__msg-contexto-btn--active" : ""}`}
                          onClick={() => seleccionarContexto("equipo")}
                        >
                          👥 El equipo
                          <span>Coordinación, ausencias, conflictos</span>
                        </button>
                        <button
                          type="button"
                          className={`panel-empleado__msg-contexto-btn ${mensajeContexto === "ambos" ? "panel-empleado__msg-contexto-btn--active" : ""}`}
                          onClick={() => seleccionarContexto("ambos")}
                        >
                          🔀 Ambos
                          <span>Involucra reporte y equipo</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Aviso cuando el contexto es "reporte" */}
                  {mensajeContexto === "reporte" && !confirmarEnvioReporte && (
                    <div className="panel-empleado__msg-aviso">
                      <p className="panel-empleado__msg-aviso-texto">
                        ⚠️ Las novedades sobre el reporte deben cargarse en la sección <strong>Novedades</strong> para quedar registradas oficialmente en el historial.
                        Si aun así querés enviar este mensaje de forma privada al admin, podés hacerlo.
                      </p>
                      <div className="panel-empleado__msg-aviso-acciones">
                        <button
                          type="button"
                          className="panel-empleado__msg-aviso-btn panel-empleado__msg-aviso-btn--novedad"
                          onClick={() => {
                            const asig = asignaciones.find((a) => a.reporte_id === mensajeReporteId);
                            if (asig) setModalNovedad(asig);
                            setActiveTab("reportes");
                          }}
                        >
                          → Cargar novedad
                        </button>
                        <button
                          type="button"
                          className="panel-empleado__msg-aviso-btn panel-empleado__msg-aviso-btn--igual"
                          onClick={() => setConfirmarEnvioReporte(true)}
                        >
                          Enviar de todas formas
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Formulario de texto */}
              {canShowMensajeForm && (
                <form onSubmit={handleEnviarMensaje} style={{ display: "contents" }}>
                  <textarea
                    className="panel-empleado__modal-textarea"
                    placeholder={
                      mensajeTipo === "general"
                        ? "Escribí tu consulta o comentario al administrador..."
                        : mensajeContexto === "equipo"
                        ? "Describí la situación con el equipo..."
                        : "Escribí tu mensaje al administrador..."
                    }
                    value={mensajeTexto}
                    onChange={(e) => setMensajeTexto(e.target.value)}
                    rows={4}
                  />
                  <button
                    className="panel-empleado__modal-confirm"
                    type="submit"
                    disabled={enviandoMensaje || !mensajeTexto.trim()}
                  >
                    {enviandoMensaje ? "Enviando..." : "✉️ Enviar mensaje"}
                  </button>
                </form>
              )}
            </div>

            {/* Historial */}
            {misMensajes.length > 0 && (
              <div className="panel-empleado__mensajes-historial">
                <p className="panel-empleado__modal-label">Mensajes enviados</p>
                {misMensajes.map((m) => (
                  <div key={m.id} className="panel-empleado__mensaje-item">
                    {m.reporteTitulo && (
                      <div className="panel-empleado__mensaje-reporte">
                        <Link to={`/reporte/${m.reporteId}`} className="panel-empleado__mensaje-reporte-link">
                          📋 {m.reporteTitulo}
                        </Link>
                        <span className={`panel-empleado__mensaje-contexto panel-empleado__mensaje-contexto--${m.contexto}`}>
                          {m.contexto === "equipo" ? "👥 Equipo" : m.contexto === "ambos" ? "🔀 Ambos" : "📋 Reporte"}
                        </span>
                      </div>
                    )}
                    <p className="panel-empleado__mensaje-contenido">{m.contenido}</p>
                    <div className="panel-empleado__mensaje-meta">
                      <span>{new Date(m.creadoEn).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <span className={`panel-empleado__mensaje-estado ${m.leido ? "panel-empleado__mensaje-estado--leido" : ""}`}>
                        {m.leido ? "✅ Visto" : "⏳ Sin leer"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>{/* fin panel-empleado__container */}

      {/* Modal: verificación en campo */}
      {modalVerificacion && (
        <div className="panel-empleado__modal-bg" onClick={(e) => e.target === e.currentTarget && setModalVerificacion(null)}>
          <div className="panel-empleado__modal">
            <h3 className="panel-empleado__modal-title">🔍 Verificación en campo</h3>
            <p className="panel-empleado__modal-desc"><strong>{modalVerificacion.title}</strong></p>

            <div className="panel-empleado__modal-field">
              <label className="panel-empleado__modal-label">¿Qué encontraste?</label>
              <div className="panel-empleado__modal-tipo-group">
                <button
                  className={`panel-empleado__modal-tipo-btn ${verResultado === "confirma" ? "panel-empleado__modal-tipo-btn--active" : ""}`}
                  onClick={() => setVerResultado("confirma")}
                >
                  ✅ Confirmo el problema
                  <span>El problema existe tal como fue reportado</span>
                </button>
                <button
                  className={`panel-empleado__modal-tipo-btn panel-empleado__modal-tipo-btn--bloqueante ${verResultado === "desmiente" ? "panel-empleado__modal-tipo-btn--active-bloqueante" : ""}`}
                  onClick={() => setVerResultado("desmiente")}
                >
                  ❌ No encontré el problema
                  <span>El problema no existe o ya fue resuelto</span>
                </button>
              </div>
            </div>

            <div className="panel-empleado__modal-field">
              <label className="panel-empleado__modal-label">
                📸 Foto del lugar <span className="panel-empleado__modal-req">(obligatoria)</span>
              </label>
              <input type="file" accept="image/*" onChange={handleFotoVerificacion} className="panel-empleado__modal-file" />
              {verFotoPreview && <img src={verFotoPreview} alt="preview" className="panel-empleado__modal-preview" />}
            </div>

            <div className="panel-empleado__modal-field">
              <label className="panel-empleado__modal-label">
                Nota adicional <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: "0.75rem" }}>(opcional)</span>
              </label>
              <textarea
                className="panel-empleado__modal-textarea"
                placeholder="Describí lo que observaste..."
                value={verNota}
                onChange={(e) => setVerNota(e.target.value)}
                rows={2}
              />
            </div>

            <div className="panel-empleado__modal-actions">
              <button className="panel-empleado__modal-cancel" onClick={() => { setModalVerificacion(null); setVerResultado(""); setVerFoto(null); setVerFotoPreview(null); setVerNota(""); }}>
                Cancelar
              </button>
              <button
                className="panel-empleado__modal-confirm"
                onClick={confirmarVerificacion}
                disabled={loadingVer || !verResultado || !verFoto}
              >
                {loadingVer ? "Enviando..." : "Enviar verificación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: avance */}
      {modalAvance && (
        <div className="panel-empleado__modal-bg" onClick={(e) => e.target === e.currentTarget && setModalAvance(null)}>
          <div className="panel-empleado__modal">
            <h3 className="panel-empleado__modal-title">📊 Registrar avance</h3>
            <p className="panel-empleado__modal-desc"><strong>{modalAvance.title}</strong></p>

            <div className="panel-empleado__modal-field">
              <label className="panel-empleado__modal-label">¿Qué hiciste hoy? <span className="panel-empleado__modal-req">(obligatorio)</span></label>
              <textarea
                className="panel-empleado__modal-textarea"
                placeholder="Ej: Colocamos señalización e iniciamos la excavación..."
                value={avanceDesc}
                onChange={(e) => setAvanceDesc(e.target.value)}
                rows={3}
              />
            </div>

            <div className="panel-empleado__modal-field">
              <label className="panel-empleado__modal-label">
                Porcentaje completado
                <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: "0.75rem" }}> (opcional)</span>
                {modalAvance?.ultimoPorcentaje > 0 && (
                  <span style={{ fontWeight: 400, color: "#64748b", fontSize: "0.75rem" }}> — actual: {modalAvance.ultimoPorcentaje}%</span>
                )}
              </label>
              <div className="panel-empleado__modal-pct-row">
                <input
                  type="range"
                  min={modalAvance?.ultimoPorcentaje ?? 0} max="100" step="5"
                  value={avancePct !== "" ? avancePct : (modalAvance?.ultimoPorcentaje ?? 0)}
                  onChange={(e) => setAvancePct(e.target.value)}
                  className="panel-empleado__modal-range"
                />
                <span className="panel-empleado__modal-pct-label">
                  {avancePct !== "" ? avancePct : (modalAvance?.ultimoPorcentaje ?? 0)}%
                </span>
              </div>
            </div>

            <div className="panel-empleado__modal-actions">
              <button className="panel-empleado__modal-cancel" onClick={() => { setModalAvance(null); setAvanceDesc(""); setAvancePct(""); }}>
                Cancelar
              </button>
              <button
                className="panel-empleado__modal-confirm"
                onClick={confirmarAvance}
                disabled={loadingAvance || !avanceDesc.trim()}
              >
                {loadingAvance ? "Guardando..." : "Registrar avance"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: novedad */}
      {modalNovedad && (
        <div className="panel-empleado__modal-bg" onClick={(e) => e.target === e.currentTarget && setModalNovedad(null)}>
          <div className="panel-empleado__modal">
            <h3 className="panel-empleado__modal-title">⚠️ Reportar novedad</h3>
            <p className="panel-empleado__modal-desc"><strong>{modalNovedad.title}</strong></p>

            <div className="panel-empleado__modal-field">
              <label className="panel-empleado__modal-label">Tipo de novedad</label>
              <div className="panel-empleado__modal-tipo-group">
                <button
                  className={`panel-empleado__modal-tipo-btn ${novedadTipo === "informativa" ? "panel-empleado__modal-tipo-btn--active" : ""}`}
                  onClick={() => setNovedadTipo("informativa")}
                >
                  📝 Informativa
                  <span>Sigo trabajando, dejo constancia</span>
                </button>
                <button
                  className={`panel-empleado__modal-tipo-btn panel-empleado__modal-tipo-btn--bloqueante ${novedadTipo === "bloqueante" ? "panel-empleado__modal-tipo-btn--active-bloqueante" : ""}`}
                  onClick={() => setNovedadTipo("bloqueante")}
                >
                  🚨 Bloqueante
                  <span>No puedo continuar hasta que el admin intervenga</span>
                </button>
              </div>
            </div>

            <div className="panel-empleado__modal-field">
              <label className="panel-empleado__modal-label">Descripción <span className="panel-empleado__modal-req">(obligatoria)</span></label>
              <textarea
                className="panel-empleado__modal-textarea"
                placeholder="Describí el problema o novedad..."
                value={novedadDesc}
                onChange={(e) => setNovedadDesc(e.target.value)}
                rows={3}
              />
            </div>

            <div className="panel-empleado__modal-field">
              <label className="panel-empleado__modal-label">Foto <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: "0.75rem" }}>(opcional)</span></label>
              <input type="file" accept="image/*" onChange={handleFotoNovedad} className="panel-empleado__modal-file" />
              {novedadFotoPreview && <img src={novedadFotoPreview} alt="preview" className="panel-empleado__modal-preview" />}
            </div>

            <div className="panel-empleado__modal-actions">
              <button className="panel-empleado__modal-cancel" onClick={() => { setModalNovedad(null); setNovedadTipo("informativa"); setNovedadDesc(""); setNovedadFoto(null); setNovedadFotoPreview(null); }}>
                Cancelar
              </button>
              <button
                className="panel-empleado__modal-confirm"
                onClick={confirmarNovedad}
                disabled={loadingNovedad || !novedadDesc.trim()}
              >
                {loadingNovedad ? "Enviando..." : "Registrar novedad"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: marcar en ejecución */}
      {modalEjecucion && (
        <div className="panel-empleado__modal-bg" onClick={(e) => e.target === e.currentTarget && setModalEjecucion(null)}>
          <div className="panel-empleado__modal">
            <h3 className="panel-empleado__modal-title">🔧 Iniciar ejecución</h3>
            <p className="panel-empleado__modal-desc">
              <strong>{modalEjecucion.title}</strong>
            </p>
            {modalEjecucion.foto ? (
              <p className="panel-empleado__modal-hint">Este reporte ya tiene foto inicial del vecino. Podés empezar directamente.</p>
            ) : (
              <div className="panel-empleado__modal-field">
                <label className="panel-empleado__modal-label">
                  📸 Foto del estado actual <span className="panel-empleado__modal-req">(obligatoria — el reporte no tiene foto inicial)</span>
                </label>
                <input type="file" accept="image/*" onChange={handleFotoCampo} className="panel-empleado__modal-file" />
                {fotoCampoPreview && <img src={fotoCampoPreview} alt="preview" className="panel-empleado__modal-preview" />}
              </div>
            )}
            <div className="panel-empleado__modal-actions">
              <button className="panel-empleado__modal-cancel" onClick={() => { setModalEjecucion(null); setFotoCampo(null); setFotoCampoPreview(null); }}>
                Cancelar
              </button>
              <button
                className="panel-empleado__modal-confirm"
                onClick={confirmarEjecucion}
                disabled={loadingEjecucion || (!modalEjecucion.foto && !fotoCampo)}
              >
                {loadingEjecucion ? "Guardando..." : "Confirmar inicio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: gestión de equipo */}
      {modalEquipo && (
        <div className="panel-empleado__modal-bg" onClick={(e) => e.target === e.currentTarget && (setModalEquipo(null), setExpandidos({}))}>
          <div className="panel-empleado__modal panel-empleado__modal--equipo">
            <h3 className="panel-empleado__modal-title">
              {!!modalEquipo.es_lider ? "👥 Gestión de equipo" : "👥 Mi equipo"}
            </h3>
            <p className="panel-empleado__modal-desc"><strong>{modalEquipo.title}</strong></p>

            {loadingEquipo ? (
              <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Cargando equipo...</p>
            ) : (
              <>
                {/* Miembros actuales */}
                {(() => {
                  const matchEsp = CATEGORIA_ESPECIALIDAD[modalEquipo?.category] ?? null;
                  return (
                    <div className="panel-empleado__equipo-lista">
                      {equipo.filter((m) => m.aprobado === 'aprobado').map((m) => {
                        const isExpanded = !!expandidos[m.empleado_id];
                        const espObj = matchEsp ? ESPECIALIDADES.find((x) => x.id === matchEsp) : null;
                        const tieneEsps = m.especialidades?.length > 0;
                        return (
                          <div
                            key={m.empleado_id}
                            className="panel-empleado__equipo-item"
                            onClick={() => navigate(`/perfil-empleado/${m.empleado_id}`)}
                          >
                            <div className="panel-empleado__equipo-row">
                              <UserAvatar avatar={m.empleado_avatar} size="sm" />
                              <div className="panel-empleado__equipo-info">
                                <span className="panel-empleado__equipo-nombre">{m.empleado_nombre}</span>
                                <span className={`panel-empleado__equipo-rol ${!!m.es_lider ? "panel-empleado__equipo-rol--lider" : ""}`}>
                                  {!!m.es_lider ? "👑 Líder" : "👤 Miembro"}
                                </span>
                              </div>
                              {!isExpanded && espObj && m.especialidades?.includes(matchEsp) && (
                                <span className="panel-empleado__equipo-esp-hint" title={espObj.label}>{espObj.icon}</span>
                              )}
                              {tieneEsps && (
                                <button
                                  className="panel-empleado__equipo-toggle"
                                  onClick={(e) => { e.stopPropagation(); setExpandidos((prev) => ({ ...prev, [m.empleado_id]: !prev[m.empleado_id] })); }}
                                  title={isExpanded ? "Ocultar especialidades" : "Ver especialidades"}
                                >
                                  {isExpanded ? "▲" : "▼"}
                                </button>
                              )}
                              {!!modalEquipo.es_lider && !m.es_lider && (
                                <button
                                  className="panel-empleado__equipo-baja"
                                  onClick={(e) => { e.stopPropagation(); handleProponerBaja(m.empleado_id); }}
                                >
                                  Proponer baja
                                </button>
                              )}
                            </div>
                            {isExpanded && (
                              <div className="panel-empleado__equipo-esps">
                                {m.especialidades.map((espId) => {
                                  const esp = ESPECIALIDADES.find((x) => x.id === espId);
                                  return esp ? (
                                    <span
                                      key={espId}
                                      className={`panel-empleado__equipo-esp-badge${espId === matchEsp ? " panel-empleado__equipo-esp-badge--match" : ""}`}
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
                    </div>
                  );
                })()}

                {/* Propuestas pendientes — solo visible para el líder */}
                {!!modalEquipo.es_lider && equipo.some((m) => m.aprobado !== 'aprobado') && (
                  <div className="panel-empleado__equipo-pendientes">
                    <p className="panel-empleado__equipo-pendientes-titulo">⏳ Pendientes de aprobación</p>
                    {equipo.filter((m) => m.aprobado !== 'aprobado').map((m) => (
                      <div key={m.empleado_id} className="panel-empleado__equipo-item panel-empleado__equipo-item--pendiente">
                        <div className="panel-empleado__equipo-row">
                          <UserAvatar avatar={m.empleado_avatar} size="sm" />
                          <div className="panel-empleado__equipo-info">
                            <span className="panel-empleado__equipo-nombre">{m.empleado_nombre}</span>
                            <span className="panel-empleado__equipo-pendiente-tipo">
                              {m.aprobado === 'pendiente' ? '➕ Alta pendiente' : '➖ Baja pendiente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Proponer nuevo miembro — solo visible para el líder */}
                {!!modalEquipo.es_lider && (
                  <div className="panel-empleado__equipo-agregar">
                    <p className="panel-empleado__modal-label">Proponer nuevo miembro</p>
                    <div className="panel-empleado__equipo-agregar-row">
                      <select
                        className="panel-empleado__modal-select"
                        value={empleadoAgregar}
                        onChange={(e) => setEmpleadoAgregar(e.target.value)}
                      >
                        <option value="">Seleccioná un empleado...</option>
                        {todosEmpleados
                          .filter((e) => !equipo.some((m) => m.empleado_id === e.id))
                          .map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name} (@{e.username}){e.reportesActivos > 0 ? ` — ${e.reportesActivos} reporte${e.reportesActivos > 1 ? "s" : ""} activo${e.reportesActivos > 1 ? "s" : ""}` : " — disponible"}
                            </option>
                          ))}
                      </select>
                      <button
                        className="panel-empleado__modal-confirm"
                        onClick={handleProponerMiembro}
                        disabled={!empleadoAgregar}
                      >
                        Proponer
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="panel-empleado__modal-actions">
              <button className="panel-empleado__modal-cancel" onClick={() => { setModalEquipo(null); setEmpleadoAgregar(""); }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: proponer cierre */}
      {modalCierre && (
        <div className="panel-empleado__modal-bg" onClick={(e) => e.target === e.currentTarget && setModalCierre(null)}>
          <div className="panel-empleado__modal">
            <h3 className="panel-empleado__modal-title">✅ Proponer cierre</h3>
            <p className="panel-empleado__modal-desc">
              <strong>{modalCierre.title}</strong>
            </p>
            <div className="panel-empleado__modal-field">
              <label className="panel-empleado__modal-label">
                📸 Foto de resolución <span className="panel-empleado__modal-req">(obligatoria)</span>
              </label>
              <input type="file" accept="image/*" onChange={handleFotoResolucion} className="panel-empleado__modal-file" />
              {fotoResolucionPreview && <img src={fotoResolucionPreview} alt="preview" className="panel-empleado__modal-preview" />}
            </div>
            <div className="panel-empleado__modal-actions">
              <button className="panel-empleado__modal-cancel" onClick={() => { setModalCierre(null); setFotoResolucion(null); setFotoResolucionPreview(null); }}>
                Cancelar
              </button>
              <button
                className="panel-empleado__modal-confirm"
                onClick={confirmarCierre}
                disabled={loadingCierre || !fotoResolucion}
              >
                {loadingCierre ? "Enviando..." : "Proponer cierre"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PRIORIDAD_INFO = {
  alta:  { label: "Alta",  color: "#dc2626", bg: "#fef2f2" },
  media: { label: "Media", color: "#d97706", bg: "#fffbeb" },
  baja:  { label: "Baja",  color: "#64748b", bg: "#f1f5f9" },
};

function getFechaLimiteInfo(fechaLimite) {
  if (!fechaLimite) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fechaLimite);
  limite.setHours(0, 0, 0, 0);
  const dias = Math.round((limite - hoy) / (1000 * 60 * 60 * 24));
  if (dias < 0)  return { label: `Venció hace ${Math.abs(dias)}d`, color: "#dc2626", bg: "#fef2f2" };
  if (dias === 0) return { label: "Vence hoy", color: "#dc2626", bg: "#fef2f2" };
  if (dias <= 3)  return { label: `Vence en ${dias}d`, color: "#d97706", bg: "#fffbeb" };
  return { label: `Límite: ${new Date(fechaLimite).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}`, color: "#64748b", bg: "#f1f5f9" };
}

function TarjetaReporte({ a, onEjecucion, onCierre, onNovedad, onAvance, onEquipo }) {
  const cat = CATEGORIES.find((c) => c.id === a.category);
  const estado = ESTADOS_INTERNOS[a.estadoInterno] || {};
  const prioridad = PRIORIDAD_INFO[a.prioridad] || null;
  const fechaInfo = getFechaLimiteInfo(a.fechaLimite);
  const tieneAcciones = onEjecucion || onCierre || onNovedad || onAvance || onEquipo;

  function stopProp(fn) {
    return (e) => { e.preventDefault(); e.stopPropagation(); fn(); };
  }

  return (
    <Link to={`/reporte/${a.reporte_id}`} className="panel-empleado__card panel-empleado__card--link">
      {(a.foto || a.fotoCampo) && (
        <div className="panel-empleado__card-photo">
          <img src={a.fotoCampo || a.foto} alt={a.title} />
        </div>
      )}
      <div className="panel-empleado__card-body">
        <div className="panel-empleado__card-meta">
          {cat && <span className="panel-empleado__card-cat">{cat.icon} {cat.label}</span>}
          <div className="panel-empleado__card-badges">
            {prioridad && (
              <span className="panel-empleado__card-prioridad" style={{ color: prioridad.color, background: prioridad.bg, borderColor: prioridad.color }}>
                🔺 {prioridad.label}
              </span>
            )}
            {fechaInfo && (
              <span className="panel-empleado__card-prioridad" style={{ color: fechaInfo.color, background: fechaInfo.bg, borderColor: fechaInfo.color }}>
                📅 {fechaInfo.label}
              </span>
            )}
            <span
              className="panel-empleado__card-estado"
              style={{ color: estado.color, background: estado.bg, borderColor: estado.color }}
            >
              {estado.label}
            </span>
          </div>
        </div>
        <h3 className="panel-empleado__card-title">{a.title}</h3>
        <p className="panel-empleado__card-desc">{a.description}</p>
        {a.location?.address && (
          <p className="panel-empleado__card-loc">📍 {a.location.address}</p>
        )}
        {a.fotoResolucion && (
          <div className="panel-empleado__card-resolucion">
            <p className="panel-empleado__card-resolucion-label">📸 Foto de resolución enviada:</p>
            <img src={a.fotoResolucion} alt="resolución" />
          </div>
        )}
        {a.estadoInterno === "asignado" && !a.es_lider && (
          <div className="panel-empleado__card-espera">
            ⏳ Esperando inicio del líder
          </div>
        )}
        {tieneAcciones && (
        <div className="panel-empleado__card-actions">
          {onEjecucion && (
            <button className="panel-empleado__card-btn panel-empleado__card-btn--iniciar" onClick={stopProp(onEjecucion)}>
              🔧 Iniciar ejecución
            </button>
          )}
          {onCierre && (
            <button className="panel-empleado__card-btn panel-empleado__card-btn--cierre" onClick={stopProp(onCierre)}>
              ✅ Proponer cierre
            </button>
          )}
          {onAvance && (
            <button className="panel-empleado__card-btn panel-empleado__card-btn--avance" onClick={stopProp(onAvance)}>
              📊 Registrar avance
            </button>
          )}
          {onNovedad && (
            <button className="panel-empleado__card-btn panel-empleado__card-btn--novedad" onClick={stopProp(onNovedad)}>
              ⚠️ Novedad
            </button>
          )}
          {onEquipo && (
            <button className="panel-empleado__card-btn panel-empleado__card-btn--equipo" onClick={stopProp(onEquipo)}>
              👥 Equipo
            </button>
          )}
        </div>
        )}
      </div>
    </Link>
  );
}
