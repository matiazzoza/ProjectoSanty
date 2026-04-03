import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useReports } from "../../context/ReportsContext";
import { useToast } from "../../context/ToastContext";
import { CATEGORIES, STATUSES } from "../../data/mockReports";
import MapPicker from "../../components/MapPicker/MapPicker";
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

  const report = getReport(id);

  if (!report) {
    return (
      <div className="report-detail report-detail--not-found">
        <p>Reporte no encontrado.</p>
        <button onClick={() => navigate("/")}>← Volver al inicio</button>
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.id === report.category);
  const statusInfo = STATUSES.find((s) => s.id === report.status) ?? STATUSES[0];
  const hasVoted = currentUser ? report.votes.includes(currentUser.id) : false;
  const isOwner = currentUser?.id === report.authorId;
  const isAdmin = currentUser?.id === "u1";
  const canChangeStatus = isOwner || isAdmin;

  function handleVote() {
    if (!currentUser) return;
    toggleVote(report.id, currentUser.id);
    addToast(hasVoted ? "Voto eliminado" : "¡Reporte apoyado!", hasVoted ? "info" : "success");
  }

  function handleDelete() {
    if (window.confirm("¿Eliminar este reporte?")) {
      deleteReport(report.id);
      addToast("Reporte eliminado", "info");
      navigate("/");
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

  return (
    <div className="report-detail">
      <div className="report-detail__container">
        <button className="report-detail__back" onClick={() => navigate(-1)}>
          ← Volver
        </button>

        {report.photo && (
          <div className="report-detail__photo">
            <img src={report.photo} alt={report.title} />
          </div>
        )}

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
          </div>

          <div className="report-detail__top-row">
            <h1 className="report-detail__title">{report.title}</h1>
            {isOwner && (
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
            <div className="report-detail__vote-block">
              <button
                className={`report-detail__vote-btn ${hasVoted ? "report-detail__vote-btn--active" : ""}`}
                onClick={handleVote}
                disabled={!currentUser}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={hasVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
                <span>{report.votes.length} {report.votes.length === 1 ? "apoyo" : "apoyos"}</span>
              </button>
              {!currentUser && (
                <span className="report-detail__vote-hint">Iniciá sesión para votar</span>
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

              {isOwner && (
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

        {/* Sección de comentarios */}
        <div className="report-detail__comments">
          <h2 className="report-detail__comments-title">
            Comentarios
            <span className="report-detail__comments-count">{report.comments?.length ?? 0}</span>
          </h2>

          {currentUser && (
            <form className="report-detail__comment-form" onSubmit={handleAddComment}>
              <div className="report-detail__comment-input-row">
                <div className="report-detail__comment-avatar">
                  {currentUser.avatar}
                </div>
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
                <div key={comment.id} className="comment">
                  <div className="comment__avatar">
                    {comment.authorName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="comment__body">
                    <div className="comment__header">
                      <span className="comment__author">{comment.authorName}</span>
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
    </div>
  );
}
