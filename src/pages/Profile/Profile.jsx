import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useReports } from "../../context/ReportsContext";
import { useToast } from "../../context/ToastContext";
import ReportCard from "../../components/ReportCard/ReportCard";
import "./Profile.scss";

const TABS = ["Mis reportes", "Reportes apoyados"];

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const { reports } = useReports();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser.name);
  const [nameSaved, setNameSaved] = useState(false);

  const myReports = reports.filter((r) => r.authorId === currentUser.id);
  const votedReports = reports.filter((r) => r.votes.includes(currentUser.id));
  const totalVotesReceived = myReports.reduce((acc, r) => acc + r.votes.length, 0);

  function handlePhotoClick() {
    fileInputRef.current?.click();
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ photo: reader.result });
      addToast("Foto de perfil actualizada", "success");
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    updateProfile({ photo: null });
    addToast("Foto de perfil eliminada", "info");
  }

  function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    updateProfile({ name: trimmed });
    setEditingName(false);
    setNameSaved(true);
    addToast("Nombre actualizado", "success");
    setTimeout(() => setNameSaved(false), 2000);
  }

  function handleNameKeyDown(e) {
    if (e.key === "Enter") handleSaveName();
    if (e.key === "Escape") { setEditingName(false); setNameInput(currentUser.name); }
  }

  const tabReports = activeTab === 0 ? myReports : votedReports;

  return (
    <div className="profile">
      <div className="profile__container">

        {/* Card de perfil */}
        <div className="profile__card">
          {/* Avatar */}
          <div className="profile__avatar-wrap">
            <div className="profile__avatar" onClick={handlePhotoClick}>
              {currentUser.photo ? (
                <img src={currentUser.photo} alt="Foto de perfil" />
              ) : (
                <span className="profile__avatar-initials">{currentUser.avatar}</span>
              )}
              <div className="profile__avatar-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span>Cambiar foto</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoChange}
            />
            {currentUser.photo && (
              <button className="profile__remove-photo" onClick={handleRemovePhoto} title="Quitar foto">
                ✕
              </button>
            )}
          </div>

          {/* Nombre editable */}
          <div className="profile__info">
            {editingName ? (
              <div className="profile__name-edit">
                <input
                  className="profile__name-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  autoFocus
                  maxLength={40}
                />
                <div className="profile__name-actions">
                  <button className="profile__name-btn profile__name-btn--save" onClick={handleSaveName}>
                    Guardar
                  </button>
                  <button
                    className="profile__name-btn profile__name-btn--cancel"
                    onClick={() => { setEditingName(false); setNameInput(currentUser.name); }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile__name-row">
                <h1 className="profile__name">{currentUser.name}</h1>
                <button className="profile__edit-name" onClick={() => setEditingName(true)} title="Editar nombre">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                {nameSaved && <span className="profile__saved-hint">✓ Guardado</span>}
              </div>
            )}
            <p className="profile__username">@{currentUser.username}</p>
          </div>

          {/* Stats */}
          <div className="profile__stats">
            <div className="profile__stat">
              <span className="profile__stat-value">{myReports.length}</span>
              <span className="profile__stat-label">Reportes</span>
            </div>
            <div className="profile__stat-divider" />
            <div className="profile__stat">
              <span className="profile__stat-value">{totalVotesReceived}</span>
              <span className="profile__stat-label">Votos recibidos</span>
            </div>
            <div className="profile__stat-divider" />
            <div className="profile__stat">
              <span className="profile__stat-value">{votedReports.length}</span>
              <span className="profile__stat-label">Apoyados</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile__tabs">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className={`profile__tab ${activeTab === i ? "profile__tab--active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              {tab}
              <span className="profile__tab-count">
                {i === 0 ? myReports.length : votedReports.length}
              </span>
            </button>
          ))}
        </div>

        {/* Lista de reportes */}
        {tabReports.length === 0 ? (
          <div className="profile__empty">
            <span>{activeTab === 0 ? "📭" : "👍"}</span>
            <p>{activeTab === 0 ? "Todavía no publicaste ningún reporte." : "Todavía no apoyaste ningún reporte."}</p>
          </div>
        ) : (
          <div className="profile__grid">
            {tabReports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
