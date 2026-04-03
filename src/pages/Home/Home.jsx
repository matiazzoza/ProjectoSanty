import { useState, useMemo } from "react";
import { useReports } from "../../context/ReportsContext";
import ReportCard from "../../components/ReportCard/ReportCard";
import CategoryFilter from "../../components/CategoryFilter/CategoryFilter";
import Pagination from "../../components/Pagination/Pagination";
import "./Home.scss";

const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "votes",  label: "Más votados" },
];

const REPORTS_PER_PAGE = 6;

export default function Home() {
  const { reports } = useReports();
  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState("recent");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...reports];
    if (category) result = result.filter((r) => r.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      );
    }
    if (sort === "votes") result.sort((a, b) => b.votes.length - a.votes.length);
    else result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [reports, category, sort, search]);

  const totalPages = Math.ceil(filtered.length / REPORTS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * REPORTS_PER_PAGE, page * REPORTS_PER_PAGE);

  function handleFilterChange(cat) {
    setCategory(cat);
    setPage(1);
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleSortChange(e) {
    setSort(e.target.value);
    setPage(1);
  }

  return (
    <div className="home">
      <div className="home__hero">
        <h1 className="home__title">Tablero municipal</h1>
        <p className="home__subtitle">
          Reportá problemas de tu barrio y votá los de tus vecinos para darles visibilidad.
        </p>
      </div>

      <div className="home__controls">
        <input
          className="home__search"
          type="text"
          placeholder="🔍  Buscar reportes..."
          value={search}
          onChange={handleSearchChange}
        />
        <select className="home__sort" value={sort} onChange={handleSortChange}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="home__filters">
        <CategoryFilter selected={category} onChange={handleFilterChange} />
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
