import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useReports } from "../../context/ReportsContext";
import { CATEGORIES } from "../../data/mockReports";
import MapPicker from "../../components/MapPicker/MapPicker";
import "./EditReport.scss";

export default function EditReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getReport, updateReport } = useReports();

  const report = getReport(id);

  // Redirigir si no existe o no es el autor
  if (!report) { navigate("/"); return null; }
  if (report.authorId !== currentUser?.id) { navigate(`/reporte/${id}`); return null; }

  const [title, setTitle] = useState(report.title);
  const [description, setDescription] = useState(report.description);
  const [category, setCategory] = useState(report.category);
  const [location, setLocation] = useState(report.location ?? null);
  const [address, setAddress] = useState(report.location?.address ?? "");
  const [photo, setPhoto] = useState(report.photo ?? null);
  const [errors, setErrors] = useState({});

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function validate() {
    const errs = {};
    if (!title.trim()) errs.title = "El título es obligatorio.";
    if (!description.trim()) errs.description = "La descripción es obligatoria.";
    if (!category) errs.category = "Seleccioná una categoría.";
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    updateReport(id, {
      title: title.trim(),
      description: description.trim(),
      category,
      location: location ? { ...location, address: address.trim() || "Ubicación en el mapa" } : null,
      photo,
    });

    navigate(`/reporte/${id}`);
  }

  return (
    <div className="edit-report">
      <div className="edit-report__container">
        <div className="edit-report__header">
          <button className="edit-report__back" onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <h1 className="edit-report__title">Editar reporte</h1>
          <p className="edit-report__subtitle">Modificá los datos de tu reporte.</p>
        </div>

        <form className="edit-report__form" onSubmit={handleSubmit}>
          <div className="edit-report__field">
            <label className="edit-report__label">Título <span>*</span></label>
            <input
              className={`edit-report__input ${errors.title ? "edit-report__input--error" : ""}`}
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
              maxLength={100}
            />
            {errors.title && <span className="edit-report__error">{errors.title}</span>}
          </div>

          <div className="edit-report__field">
            <label className="edit-report__label">Categoría <span>*</span></label>
            <select
              className={`edit-report__input edit-report__select ${errors.category ? "edit-report__input--error" : ""}`}
              value={category}
              onChange={(e) => { setCategory(e.target.value); setErrors((p) => ({ ...p, category: "" })); }}
            >
              <option value="">Seleccioná una categoría...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
              ))}
            </select>
            {errors.category && <span className="edit-report__error">{errors.category}</span>}
          </div>

          <div className="edit-report__field">
            <label className="edit-report__label">Descripción <span>*</span></label>
            <textarea
              className={`edit-report__input edit-report__textarea ${errors.description ? "edit-report__input--error" : ""}`}
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: "" })); }}
              rows={4}
              maxLength={600}
            />
            <span className="edit-report__counter">{description.length}/600</span>
            {errors.description && <span className="edit-report__error">{errors.description}</span>}
          </div>

          <div className="edit-report__field">
            <label className="edit-report__label">Dirección (opcional)</label>
            <input
              className="edit-report__input"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="edit-report__field">
            <label className="edit-report__label">
              Ubicación en el mapa
              <span className="edit-report__label-hint"> — hacé clic para mover el marcador</span>
            </label>
            <MapPicker value={location} onChange={setLocation} height="260px" />
            {location && (
              <span className="edit-report__coords">
                📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            )}
          </div>

          <div className="edit-report__field">
            <label className="edit-report__label">Foto (opcional)</label>
            <label className="edit-report__photo-label">
              <input type="file" accept="image/*" onChange={handlePhoto} hidden />
              {photo ? (
                <div className="edit-report__photo-preview">
                  <img src={photo} alt="preview" />
                  <button type="button" className="edit-report__photo-remove" onClick={() => setPhoto(null)}>✕</button>
                </div>
              ) : (
                <div className="edit-report__photo-placeholder">
                  <span>📷</span>
                  <span>Hacé clic para subir una foto</span>
                </div>
              )}
            </label>
          </div>

          <div className="edit-report__actions">
            <button type="button" className="edit-report__btn edit-report__btn--secondary" onClick={() => navigate(-1)}>
              Cancelar
            </button>
            <button type="submit" className="edit-report__btn edit-report__btn--primary">
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
