import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useReports } from "../../context/ReportsContext";
import { CATEGORIES, STATUSES } from "../../data/mockReports";
import "./ReportCard.scss";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function ReportCard({ report }) {
  const { currentUser } = useAuth();
  const { toggleVote, deleteReport } = useReports();

  const category = CATEGORIES.find((c) => c.id === report.category);
  const statusInfo = STATUSES.find((s) => s.id === report.status);
  const hasVoted = currentUser ? report.votes.includes(currentUser.id) : false;
  const isOwner = currentUser?.id === report.authorId;

  function handleVote(e) {
    e.preventDefault();
    if (!currentUser) return;
    toggleVote(report.id, currentUser.id);
  }

  function handleDelete(e) {
    e.preventDefault();
    if (window.confirm("¿Eliminar este reporte?")) deleteReport(report.id);
  }

  return (
    <Link to={`/reporte/${report.id}`} className="report-card">
      {report.photo && (
        <div className="report-card__photo">
          <img src={report.photo} alt={report.title} />
        </div>
      )}

      <div className="report-card__body">
        <div className="report-card__meta">
          {category && (
            <span className="report-card__category">
              {category.icon} {category.label}
            </span>
          )}
          <div className="report-card__meta-right">
            {statusInfo && (
              <span
                className="report-card__status"
                style={{ color: statusInfo.color, borderColor: statusInfo.color, background: `${statusInfo.color}14` }}
              >
                {statusInfo.label}
              </span>
            )}
            <span className="report-card__date">{formatDate(report.createdAt)}</span>
          </div>
        </div>

        <h3 className="report-card__title">{report.title}</h3>
        <p className="report-card__description">{report.description}</p>

        {report.location?.address && (
          <p className="report-card__location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {report.location.address}
          </p>
        )}

        <div className="report-card__footer">
          <div className="report-card__author">
            <div className="report-card__author-avatar">
              {report.authorName.slice(0, 2).toUpperCase()}
            </div>
            <span>{report.authorName}</span>
          </div>

          <div className="report-card__actions">
            {isOwner && (
              <button
                className="report-card__delete"
                onClick={handleDelete}
                title="Eliminar reporte"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            )}
            <button
              className={`report-card__vote ${hasVoted ? "report-card__vote--active" : ""}`}
              onClick={handleVote}
              title={hasVoted ? "Quitar voto" : "Apoyar reporte"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={hasVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
              <span>{report.votes.length}</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
