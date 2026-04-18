import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../controllers/AuthController";
import { useToast } from "../../controllers/ToastController";
import { getMisAsignaciones, marcarEnEjecucion, proponerCierre } from "../../models/asignacionModel";
import { cargarNovedad } from "../../models/novedadModel";
import { CATEGORIES } from "../../data/mockReports";
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
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal en ejecución
  const [modalEjecucion, setModalEjecucion] = useState(null);
  const [fotoCampo, setFotoCampo] = useState(null);
  const [fotoCampoPreview, setFotoCampoPreview] = useState(null);
  const [loadingEjecucion, setLoadingEjecucion] = useState(false);

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

  useEffect(() => {
    getMisAsignaciones()
      .then(setAsignaciones)
      .catch(() => addToast("Error cargando asignaciones", "error"))
      .finally(() => setLoading(false));
  }, []);

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

  const pendientes  = asignaciones.filter((a) => a.estadoInterno === "asignado");
  const enCurso     = asignaciones.filter((a) => a.estadoInterno === "en_ejecucion" || a.estadoInterno === "pendiente_validacion");
  const resueltos   = asignaciones.filter((a) => a.estadoInterno === "resuelto");

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
            <div className="panel-empleado__stat"><span>{resueltos.length}</span>Resueltos</div>
          </div>
        </div>

        {asignaciones.length === 0 ? (
          <div className="panel-empleado__empty">
            <p>No tenés reportes asignados aún.</p>
          </div>
        ) : (
          <>
            {pendientes.length > 0 && (
              <section className="panel-empleado__section">
                <h2 className="panel-empleado__section-title">📋 Pendientes de iniciar</h2>
                <div className="panel-empleado__grid">
                  {pendientes.map((a) => <TarjetaReporte key={a.reporte_id} a={a} onEjecucion={() => setModalEjecucion(a)} />)}
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
                    />
                  ))}
                </div>
              </section>
            )}
            {resueltos.length > 0 && (
              <section className="panel-empleado__section">
                <h2 className="panel-empleado__section-title">✅ Resueltos</h2>
                <div className="panel-empleado__grid">
                  {resueltos.map((a) => <TarjetaReporte key={a.reporte_id} a={a} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>

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

function TarjetaReporte({ a, onEjecucion, onCierre, onNovedad }) {
  const cat = CATEGORIES.find((c) => c.id === a.category);
  const estado = ESTADOS_INTERNOS[a.estadoInterno] || {};

  return (
    <div className="panel-empleado__card">
      {(a.foto || a.fotoCampo) && (
        <div className="panel-empleado__card-photo">
          <img src={a.fotoCampo || a.foto} alt={a.title} />
        </div>
      )}
      <div className="panel-empleado__card-body">
        <div className="panel-empleado__card-meta">
          {cat && <span className="panel-empleado__card-cat">{cat.icon} {cat.label}</span>}
          <span
            className="panel-empleado__card-estado"
            style={{ color: estado.color, background: estado.bg, borderColor: estado.color }}
          >
            {estado.label}
          </span>
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
        <div className="panel-empleado__card-actions">
          <Link to={`/reporte/${a.reporte_id}`} className="panel-empleado__card-ver">
            Ver reporte →
          </Link>
          {onEjecucion && (
            <button className="panel-empleado__card-btn panel-empleado__card-btn--iniciar" onClick={onEjecucion}>
              🔧 Iniciar ejecución
            </button>
          )}
          {onCierre && (
            <button className="panel-empleado__card-btn panel-empleado__card-btn--cierre" onClick={onCierre}>
              ✅ Proponer cierre
            </button>
          )}
          {onNovedad && (
            <button className="panel-empleado__card-btn panel-empleado__card-btn--novedad" onClick={onNovedad}>
              ⚠️ Novedad
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
