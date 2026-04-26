import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../controllers/AuthController";
import { useReports } from "../../controllers/ReportsController";
import { useToast } from "../../controllers/ToastController";
import { getEmpleados, crearEmpleado, editarEmpleado, toggleEmpleado, getPerfilEmpleado } from "../../models/asignacionModel";
import { getAllNovedades, responderNovedad } from "../../models/novedadModel";
import EmpleadoPerfilModal from "../../components/EmpleadoPerfilModal/EmpleadoPerfilModal";
import { CATEGORIES, STATUSES } from "../../data/mockReports";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "./Admin.scss";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function Admin() {
  const { currentUser } = useAuth();
  const { reports, updateStatus, deleteReport } = useReports();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEmpleado, setFilterEmpleado] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("reportes"); // 'reportes' | 'empleados' | 'novedades'
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Empleados
  const [empleados, setEmpleados] = useState([]);
  const [loadingEmp, setLoadingEmp] = useState(false);
  const [showFormEmp, setShowFormEmp] = useState(false);
  const [empNombre, setEmpNombre] = useState("");
  const [empUsername, setEmpUsername] = useState("");
  const [empPassword, setEmpPassword] = useState("");
  const [savingEmp, setSavingEmp] = useState(false);

  // Editar empleado
  const [editEmp, setEditEmp] = useState(null); // empleado que se está editando
  const [editNombre, setEditNombre] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Perfil empleado
  const [perfilEmp, setPerfilEmp] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);

  // Novedades
  const [novedades, setNovedades] = useState([]);
  const [loadingNovedades, setLoadingNovedades] = useState(false);
  const [respuestas, setRespuestas] = useState({}); // { [novedadId]: texto }
  const [enviando, setEnviando] = useState(null); // id de la novedad que se está enviando

  useEffect(() => {
    setLoadingEmp(true);
    getEmpleados().then(setEmpleados).catch(() => {}).finally(() => setLoadingEmp(false));
    setLoadingNovedades(true);
    getAllNovedades().then(setNovedades).catch(() => {}).finally(() => setLoadingNovedades(false));
  }, []);

  if (currentUser?.id !== "u1") {
    return (
      <div className="admin admin--forbidden">
        <span>🚫</span>
        <h2>Acceso denegado</h2>
        <p>Solo el administrador puede acceder a este panel.</p>
        <button onClick={() => navigate("/tablero-reportes")}>← Volver al inicio</button>
      </div>
    );
  }

  const totalVotes = reports.reduce((a, r) => a + r.votes.length, 0);
  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s.id] = reports.filter((r) => r.status === s.id).length;
    return acc;
  }, {});

  const filtered = reports.filter((r) => {
    if (filterCategory && r.category !== filterCategory) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterEmpleado && r.empleado?.id !== filterEmpleado) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function handleStatusChange(reportId, status) {
    updateStatus(reportId, status);
    addToast("Estado actualizado", "success");
  }

  function handleDelete(reportId, title) {
    if (window.confirm(`¿Eliminar "${title}"?`)) {
      deleteReport(reportId);
      addToast("Reporte eliminado", "info");
    }
  }

  async function handleCrearEmpleado(e) {
    e.preventDefault();
    if (!empNombre.trim() || !empUsername.trim() || !empPassword.trim()) return;
    setSavingEmp(true);
    try {
      const nuevo = await crearEmpleado({ name: empNombre.trim(), username: empUsername.trim(), password: empPassword.trim() });
      setEmpleados((prev) => [...prev, nuevo]);
      setShowFormEmp(false);
      setEmpNombre(""); setEmpUsername(""); setEmpPassword("");
      addToast("Empleado creado correctamente", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSavingEmp(false);
    }
  }

  function exportarExcel() {
    const rows = filtered.map((r) => {
      const cat = CATEGORIES.find((c) => c.id === r.category);
      const statusInfo = STATUSES.find((s) => s.id === r.status);
      return {
        Título: r.title,
        Categoría: cat ? `${cat.icon} ${cat.label}` : r.category,
        Autor: r.authorName,
        Barrio: r.barrio?.nombre ?? "—",
        Estado: statusInfo?.label ?? r.status,
        Votos: r.votes.length,
        Fecha: formatDate(r.createdAt),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reportes");
    XLSX.writeFile(wb, `reportamuni_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setShowExportMenu(false);
  }

  function exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("ReportaMuni — Listado de reportes", 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Exportado el ${new Date().toLocaleDateString("es-AR")} · ${filtered.length} registro(s)`, 14, 23);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 28,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      head: [["Título", "Categoría", "Autor", "Barrio", "Estado", "Votos", "Fecha"]],
      body: filtered.map((r) => {
        const cat = CATEGORIES.find((c) => c.id === r.category);
        const statusInfo = STATUSES.find((s) => s.id === r.status);
        return [
          r.title,
          cat ? `${cat.icon} ${cat.label}` : r.category,
          r.authorName,
          r.barrio?.nombre ?? "—",
          statusInfo?.label ?? r.status,
          r.votes.length,
          formatDate(r.createdAt),
        ];
      }),
    });

    doc.save(`reportamuni_${new Date().toISOString().slice(0, 10)}.pdf`);
    setShowExportMenu(false);
  }

  function abrirEdicion(emp) {
    setEditEmp(emp);
    setEditNombre(emp.name);
    setEditUsername(emp.username);
    setEditPassword("");
  }

  function cerrarEdicion() {
    setEditEmp(null);
    setEditNombre(""); setEditUsername(""); setEditPassword("");
  }

  async function handleEditarEmpleado(e) {
    e.preventDefault();
    if (!editNombre.trim() || !editUsername.trim()) return;
    setSavingEdit(true);
    try {
      const actualizado = await editarEmpleado(editEmp.id, {
        name: editNombre.trim(),
        username: editUsername.trim(),
        password: editPassword.trim() || undefined,
      });
      setEmpleados((prev) => prev.map((em) => em.id === actualizado.id ? { ...em, ...actualizado } : em));
      cerrarEdicion();
      addToast("Empleado actualizado", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSavingEdit(false);
    }
  }

  async function abrirPerfil(id) {
    setPerfilEmp(null);
    setLoadingPerfil(true);
    try {
      const data = await getPerfilEmpleado(id);
      setPerfilEmp(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoadingPerfil(false);
    }
  }

  async function handleResponderNovedad(novedadId) {
    const respuesta = respuestas[novedadId]?.trim();
    if (!respuesta) return;
    setEnviando(novedadId);
    try {
      await responderNovedad(novedadId, respuesta);
      setNovedades((prev) => prev.map((n) =>
        n.id === novedadId ? { ...n, respuestaAdmin: respuesta } : n
      ));
      setRespuestas((prev) => ({ ...prev, [novedadId]: "" }));
      addToast("Respuesta enviada al empleado", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setEnviando(null);
    }
  }

  async function handleToggleEmpleado(id) {
    try {
      const { activo } = await toggleEmpleado(id);
      setEmpleados((prev) => prev.map((e) => e.id === id ? { ...e, activo } : e));
      addToast(activo ? "Empleado activado" : "Empleado desactivado", "info");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  return (
    <div className="admin">
      <div className="admin__container">

        <div className="admin__header">
          <div>
            <h1 className="admin__title">Panel de administración</h1>
            <p className="admin__subtitle">Gestioná reportes y empleados de la plataforma.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin__tabs">
          <button className={`admin__tab ${tab === "reportes" ? "admin__tab--active" : ""}`} onClick={() => setTab("reportes")}>
            📋 Reportes
          </button>
          <button className={`admin__tab ${tab === "empleados" ? "admin__tab--active" : ""}`} onClick={() => setTab("empleados")}>
            👷 Empleados
            <span className="admin__tab-count">{empleados.length}</span>
          </button>
          <button className={`admin__tab ${tab === "novedades" ? "admin__tab--active" : ""}`} onClick={() => setTab("novedades")}>
            ⚠️ Novedades
            <span className="admin__tab-count">{novedades.filter((n) => !n.respuestaAdmin).length}</span>
          </button>
        </div>

        {/* Sección empleados */}
        {tab === "empleados" && (
          <div className="admin__empleados">
            <div className="admin__empleados-header">
              <h2 className="admin__empleados-title">Empleados municipales</h2>
              <button className="admin__empleados-add" onClick={() => setShowFormEmp((v) => !v)}>
                {showFormEmp ? "Cancelar" : "+ Nuevo empleado"}
              </button>
            </div>

            {showFormEmp && (
              <form className="admin__emp-form" onSubmit={handleCrearEmpleado}>
                <input className="admin__emp-input" placeholder="Nombre completo" value={empNombre} onChange={(e) => setEmpNombre(e.target.value)} required />
                <input className="admin__emp-input" placeholder="Nombre de usuario" value={empUsername} onChange={(e) => setEmpUsername(e.target.value)} required />
                <input className="admin__emp-input" type="password" placeholder="Contraseña" value={empPassword} onChange={(e) => setEmpPassword(e.target.value)} required />
                <button className="admin__emp-submit" type="submit" disabled={savingEmp}>
                  {savingEmp ? "Guardando..." : "Crear empleado"}
                </button>
              </form>
            )}

            {loadingEmp ? (
              <p className="admin__empty-row">Cargando...</p>
            ) : empleados.length === 0 ? (
              <p className="admin__empty-row">No hay empleados registrados.</p>
            ) : (
              <div className="admin__emp-list">
                {empleados.map((emp) => (
                  <div key={emp.id} className={`admin__emp-card ${!emp.activo ? "admin__emp-card--inactivo" : ""}`}>
                    <div className="admin__emp-avatar">{emp.avatar}</div>
                    <div className="admin__emp-info">
                      <span className="admin__emp-name">{emp.name}</span>
                      <span className="admin__emp-username">@{emp.username}</span>
                    </div>
                    <span className={`admin__emp-estado ${emp.activo ? "admin__emp-estado--activo" : "admin__emp-estado--inactivo"}`}>
                      {emp.activo ? "Activo" : "Inactivo"}
                    </span>
                    <div className="admin__emp-actions">
                      <button className="admin__emp-btn admin__emp-btn--perfil" onClick={() => abrirPerfil(emp.id)}>Ver perfil</button>
                      <button className="admin__emp-btn admin__emp-btn--editar" onClick={() => abrirEdicion(emp)}>Editar</button>
                      <button
                        className={`admin__emp-toggle ${emp.activo ? "admin__emp-toggle--desactivar" : "admin__emp-toggle--activar"}`}
                        onClick={() => handleToggleEmpleado(emp.id)}
                      >
                        {emp.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal editar empleado */}
            {editEmp && (
              <div className="admin__modal-backdrop" onClick={cerrarEdicion}>
                <div className="admin__modal" onClick={(e) => e.stopPropagation()}>
                  <div className="admin__modal-header">
                    <h3>Editar empleado</h3>
                    <button className="admin__modal-close" onClick={cerrarEdicion}>✕</button>
                  </div>
                  <form className="admin__emp-form" onSubmit={handleEditarEmpleado}>
                    <input className="admin__emp-input" placeholder="Nombre completo" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} required />
                    <input className="admin__emp-input" placeholder="Nombre de usuario" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} required />
                    <input className="admin__emp-input" type="password" placeholder="Nueva contraseña (dejar vacío para no cambiar)" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                    <button className="admin__emp-submit" type="submit" disabled={savingEdit}>
                      {savingEdit ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            <EmpleadoPerfilModal
              perfil={perfilEmp}
              loading={loadingPerfil}
              onClose={() => setPerfilEmp(null)}
            />
          </div>
        )}

        {/* Sección novedades */}
        {tab === "novedades" && (
          <div className="admin__novedades">
            <h2 className="admin__empleados-title">Novedades de empleados</h2>
            {loadingNovedades ? (
              <p className="admin__empty-row">Cargando...</p>
            ) : novedades.length === 0 ? (
              <p className="admin__empty-row">No hay novedades registradas.</p>
            ) : (
              <div className="admin__novedades-list">
                {novedades.map((n) => (
                  <div key={n.id} className={`admin__novedad admin__novedad--${n.tipo}`}>
                    <div className="admin__novedad-header">
                      <span className="admin__novedad-tipo">
                        {n.tipo === "bloqueante" ? "🚨 Bloqueante" : "📝 Informativa"}
                      </span>
                      <span className="admin__novedad-empleado">👷 {n.empleadoNombre}</span>
                      <a
                        className="admin__novedad-reporte"
                        href={`/reporte/${n.reporteId}`}
                        onClick={(e) => { e.preventDefault(); navigate(`/reporte/${n.reporteId}`); }}
                      >
                        {n.reporteTitulo} →
                      </a>
                      <span className="admin__novedad-fecha">
                        {new Date(n.creadoEn).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <p className="admin__novedad-desc">{n.descripcion}</p>
                    {n.respuestaAdmin ? (
                      <div className="admin__novedad-respondida">
                        <span className="admin__novedad-respondida-label">✅ Respondida:</span>
                        <p className="admin__novedad-respondida-texto">{n.respuestaAdmin}</p>
                      </div>
                    ) : (
                      <div className="admin__novedad-respuesta">
                        <textarea
                          className="admin__novedad-textarea"
                          placeholder="Escribí tu respuesta al empleado..."
                          rows={2}
                          value={respuestas[n.id] || ""}
                          onChange={(e) => setRespuestas((prev) => ({ ...prev, [n.id]: e.target.value }))}
                        />
                        <button
                          className="admin__novedad-btn"
                          onClick={() => handleResponderNovedad(n.id)}
                          disabled={enviando === n.id || !respuestas[n.id]?.trim()}
                        >
                          {enviando === n.id ? "Enviando..." : "Responder"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "reportes" && <>
        {/* Stats */}
        <div className="admin__stats">
          <div className="admin__stat">
            <span className="admin__stat-value">{reports.length}</span>
            <span className="admin__stat-label">Total reportes</span>
          </div>
          <div className="admin__stat">
            <span className="admin__stat-value">{totalVotes}</span>
            <span className="admin__stat-label">Total votos</span>
          </div>
          {STATUSES.map((s) => (
            <div key={s.id} className="admin__stat">
              <span className="admin__stat-value" style={{ color: s.color }}>{statusCounts[s.id] ?? 0}</span>
              <span className="admin__stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="admin__filters">
          <input
            className="admin__search"
            type="text"
            placeholder="🔍 Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="admin__select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
          <select className="admin__select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select className="admin__select" value={filterEmpleado} onChange={(e) => setFilterEmpleado(e.target.value)}>
            <option value="">Todos los empleados</option>
            {empleados.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
          <div className="admin__export-wrap">
            <button className="admin__export-btn" onClick={() => setShowExportMenu((v) => !v)}>
              ⬇️ Exportar ▾
            </button>
            {showExportMenu && (
              <>
                <div className="admin__export-backdrop" onClick={() => setShowExportMenu(false)} />
                <div className="admin__export-menu">
                  <button className="admin__export-option" onClick={exportarPDF}>📄 PDF</button>
                  <button className="admin__export-option" onClick={exportarExcel}>📊 Excel</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr>
                <th>Reporte</th>
                <th>Categoría</th>
                <th>Autor</th>
                <th>Votos</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin__empty-row">No hay reportes que coincidan.</td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const cat = CATEGORIES.find((c) => c.id === r.category);
                  const statusInfo = STATUSES.find((s) => s.id === r.status);
                  return (
                    <tr key={r.id}>
                      <td>
                        <a
                          className="admin__report-link"
                          href={`/reporte/${r.id}`}
                          onClick={(e) => { e.preventDefault(); navigate(`/reporte/${r.id}`); }}
                        >
                          {r.title}
                        </a>
                      </td>
                      <td>
                        <span className="admin__category">
                          {cat?.icon} {cat?.label}
                        </span>
                      </td>
                      <td className="admin__author">{r.authorName}</td>
                      <td className="admin__votes">👍 {r.votes.length}</td>
                      <td className="admin__date">{formatDate(r.createdAt)}</td>
                      <td>
                        <select
                          className="admin__status-select"
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          style={{ color: statusInfo?.color, borderColor: statusInfo?.color }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="admin__delete-btn"
                          onClick={() => handleDelete(r.id, r.title)}
                          title="Eliminar reporte"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        </>}

      </div>
    </div>
  );
}
