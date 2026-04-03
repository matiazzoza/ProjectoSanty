import "./Pagination.scss";

export default function Pagination({ currentPage, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <button
        className="pagination__btn"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← Anterior
      </button>

      <div className="pagination__pages">
        {pages.map((p) => (
          <button
            key={p}
            className={`pagination__page ${p === currentPage ? "pagination__page--active" : ""}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        className="pagination__btn"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Siguiente →
      </button>
    </div>
  );
}
