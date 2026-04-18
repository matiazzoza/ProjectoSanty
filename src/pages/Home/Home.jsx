import { useState, useMemo, useEffect } from "react";
import { useReports } from "../../controllers/ReportsController";
import { getAll as getBarrios } from "../../models/barrioModel";
import ReportCard from "../../components/ReportCard/ReportCard";
import CategoryFilter from "../../components/CategoryFilter/CategoryFilter";
import Pagination from "../../components/Pagination/Pagination";
import "./Home.scss";

const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "votes",  label: "Más votados" },
];

const FECHA_OPTIONS = [
  { value: "all",   label: "Cualquier fecha" },
  { value: "today", label: "Hoy" },
  { value: "week",  label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "year",  label: "Este año" },
];

const REPORTS_PER_PAGE = 6;

export default function Home() {
  const { reports } = useReports();
  const [category, setCategory]   = useState(null);
  const [sort, setSort]           = useState("recent");
  const [search, setSearch]       = useState("");
  const [barrio, setBarrio]       = useState("");
  const [fecha, setFecha]         = useState("all");
  const [page, setPage]           = useState(1);
  const [showObras, setShowObras] = useState(false);
  const [showEnProceso, setShowEnProceso] = useState(false);
  const [barrios, setBarrios]     = useState([]);

  useEffect(() => {
    getBarrios().then(setBarrios).catch(() => {});
  }, []);

  const resolvedReports  = useMemo(() => reports.filter((r) => r.status === "resuelto"),   [reports]);
  const enProcesoReports = useMemo(() => reports.filter((r) => r.status === "en_proceso"), [reports]);

  function handleObras() {
    setShowObras((v) => !v);
    setShowEnProceso(false);
  }

  function handleEnProceso() {
    setShowEnProceso((v) => !v);
    setShowObras(false);
  }

  function resetFiltros() {
    setCategory(null);
    setBarrio("");
    setFecha("all");
    setSearch("");
    setSort("recent");
    setPage(1);
  }

  const hasFilters = !!(category || barrio || fecha !== "all" || search.trim() || sort !== "recent");

  const filtered = useMemo(() => {
    let result = showObras
      ? reports.filter((r) => r.status === "resuelto")
      : showEnProceso
      ? reports.filter((r) => r.status === "en_proceso")
      : reports.filter((r) => r.status === "pendiente");

    if (category) result = result.filter((r) => r.category === category);

    if (barrio) result = result.filter((r) => r.barrio?.id === Number(barrio));

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      );
    }

    if (fecha !== "all") {
      const now = new Date();
      result = result.filter((r) => {
        const d = new Date(r.createdAt);
        if (fecha === "today") return d.toDateString() === now.toDateString();
        if (fecha === "week") {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return d >= weekAgo;
        }
        if (fecha === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (fecha === "year")  return d.getFullYear() === now.getFullYear();
        return true;
      });
    }

    if (sort === "votes") result = [...result].sort((a, b) => b.votes.length - a.votes.length);
    else result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return result;
  }, [reports, category, barrio, sort, search, fecha, showObras, showEnProceso]);

  const totalPages = Math.ceil(filtered.length / REPORTS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * REPORTS_PER_PAGE, page * REPORTS_PER_PAGE);

  function handleFilterChange(cat) { setCategory(cat); setPage(1); }
  function handleSearchChange(e)   { setSearch(e.target.value); setPage(1); }
  function handleSortChange(e)     { setSort(e.target.value); setPage(1); }
  function handleBarrioChange(e)   { setBarrio(e.target.value); setPage(1); }
  function handleFechaChange(e)    { setFecha(e.target.value); setPage(1); }

  return (
    <div className="home">
      <div className="home__hero">
        <div className="home__hero-row">
          <div>
            <h1 className="home__title">Tablero municipal</h1>
            <p className="home__subtitle">
              Reportá problemas de tu barrio y votá los de tus vecinos para darles visibilidad.
            </p>
          </div>
          <div className="home__hero-btns">
            <button
              className={`home__obras-btn home__obras-btn--proceso ${showEnProceso ? "home__obras-btn--proceso-active" : ""}`}
              onClick={handleEnProceso}
            >
              🔧 En proceso
              <span className="home__obras-count home__obras-count--proceso">{enProcesoReports.length}</span>
            </button>
            <button
              className={`home__obras-btn ${showObras ? "home__obras-btn--active" : ""}`}
              onClick={handleObras}
            >
              ✅ Obras realizadas
              <span className="home__obras-count">{resolvedReports.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controles de búsqueda y filtros */}
      <div className="home__controls">
        <input
          className="home__search"
          type="text"
          placeholder="🔍  Buscar reportes..."
          value={search}
          onChange={handleSearchChange}
        />
        <select className="home__select" value={barrio} onChange={handleBarrioChange}>
          <option value="">Todos los barrios</option>
          {barrios.map((b) => (
            <option key={b.id} value={b.id}>{b.nombre}</option>
          ))}
        </select>
        <select className="home__select" value={fecha} onChange={handleFechaChange}>
          {FECHA_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className="home__select" value={sort} onChange={handleSortChange}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Filtro por categoría + botón limpiar */}
      <div className="home__filters-row">
        <div className="home__filters">
          <CategoryFilter selected={category} onChange={handleFilterChange} />
        </div>
        {hasFilters && (
          <button className="home__clear-btn" onClick={resetFiltros}>
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="home__empty">
          <span>📭</span>
          <p>No hay reportes que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <>
          <p className="home__count">{filtered.length} reporte{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p>
          <div className="home__grid">
            {paginated.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
