import { useState, useEffect } from "react";
import { useAuth } from "../../controllers/AuthController";
import { useReports } from "../../controllers/ReportsController";
import { useToast } from "../../controllers/ToastController";
import { getByUsuario as getSeguidos } from "../../models/seguimientoModel";
import ReportCard from "../../components/ReportCard/ReportCard";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import AvatarPicker from "../../components/AvatarPicker/AvatarPicker";
import CambiarContrasena from "../../components/CambiarContrasena/CambiarContrasena";
import "./Profile.scss";

const TABS = ["Mis reportes", "Reportes apoyados", "Mis seguimientos"];

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const { reports } = useReports();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [modalPwd, setModalPwd] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser.name);
  const [nameSaved, setNameSaved] = useState(false);
  const [seguidosIds, setSeguidosIds] = useState([]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    getSeguidos(currentUser.id)
      .then(setSeguidosIds)
      .catch(() => {});
  }, [currentUser.id]);

  const myReports = reports.filter((r) => r.authorId === currentUser.id);
  const votedReports = reports.filter((r) => r.votes.includes(currentUser.id));
  const followedReports = reports.filter((r) => seguidosIds.includes(r.id));
  const totalVotesReceived = myReports.reduce((acc, r) => acc + r.votes.length, 0);

  function handleAvatarChange(emoji) {
    updateProfile({ avatar: emoji });
    setShowAvatarPicker(false);
    addToast("Avatar actualizado", "success");
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

  const tabReports = activeTab === 0 ? myReports : activeTab === 1 ? votedReports : followedReports;
  const tabCounts = [myReports.length, votedReports.length, followedReports.length];
  const emptyIcons = ["📭", "👍", "🔔"];
  const emptyTexts = [
    "Todavía no publicaste ningún reporte.",
    "Todavía no apoyaste ningún reporte.",
    "Todavía no seguís ningún reporte.",
  ];

  return (
    <div className="profile">
      <div className="profile__container">

        {/* Card de perfil */}
        <div className="profile__card">
          {/* Avatar */}
          <div className="profile__avatar-wrap">
            <div className="profile__avatar" onClick={() => setShowAvatarPicker((v) => !v)} title="Cambiar avatar">
              <UserAvatar avatar={currentUser.avatar} size="xl" />
              <div className="profile__avatar-overlay">
                <span>Cambiar</span>
              </div>
            </div>
            {showAvatarPicker && (
              <div className="profile__avatar-picker">
                <AvatarPicker value={currentUser.avatar} onChange={handleAvatarChange} />
              </div>
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
                <button className="profile__pwd-btn" onClick={() => setModalPwd(true)} title="Cambiar contraseña">🔒</button>
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
            <div className="profile__stat-divider" />
            <div className="profile__stat">
              <span className="profile__stat-value">{followedReports.length}</span>
              <span className="profile__stat-label">Seguimientos</span>
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
              {tabCounts[i] !== null && <span className="profile__tab-count">{tabCounts[i]}</span>}
            </button>
          ))}
        </div>

        {tabReports.length === 0 ? (
          <div className="profile__empty">
            <span>{emptyIcons[activeTab]}</span>
            <p>{emptyTexts[activeTab]}</p>
          </div>
        ) : (
          <div className="profile__grid">
            {tabReports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}

        {modalPwd && (
          <div className="profile__modal-bg" onClick={(e) => e.target === e.currentTarget && setModalPwd(false)}>
            <div className="profile__modal-pwd">
              <CambiarContrasena onClose={() => setModalPwd(false)} />
              <button className="profile__modal-pwd-cerrar" onClick={() => setModalPwd(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
