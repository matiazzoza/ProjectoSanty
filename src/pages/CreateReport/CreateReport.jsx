import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useReports } from "../../context/ReportsContext";
import { useToast } from "../../context/ToastContext";
import { CATEGORIES } from "../../data/mockReports";
import MapPicker from "../../components/MapPicker/MapPicker";
import "./CreateReport.scss";

export default function CreateReport() {
  const { currentUser } = useAuth();
  const { addReport } = useReports();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState(null);
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

    const report = {
      id: `r${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      location: location ? { ...location, address: address.trim() || "Ubicación en el mapa" } : null,
      photo,
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: new Date().toISOString(),
      votes: [],
    };

    addReport(report);
    addToast("¡Reporte publicado con éxito!", "success");
    navigate("/");
  }

  return (
    <div className="create-report">
      <div className="create-report__container">
        <div className="create-report__header">
          <button className="create-report__back" onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <h1 className="create-report__title">Nuevo reporte</h1>
          <p className="create-report__subtitle">Completá los datos del problema que querés reportar.</p>
        </div>

        <form className="create-report__form" onSubmit={handleSubmit}>
          <div className="create-report__field">
            <label className="create-report__label">Título <span>*</span></label>
            <input
              className={`create-report__input ${errors.title ? "create-report__input--error" : ""}`}
              type="text"
              placeholder="Ej: Bache en Av. Corrientes 1200"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
              maxLength={100}
            />
            {errors.title && <span className="create-report__error">{errors.title}</span>}
          </div>

          <div className="create-report__field">
            <label className="create-report__label">Categoría <span>*</span></label>
            <select
              className={`create-report__input create-report__select ${errors.category ? "create-report__input--error" : ""}`}
              value={category}
              onChange={(e) => { setCategory(e.target.value); setErrors((p) => ({ ...p, category: "" })); }}
            >
              <option value="">Seleccioná una categoría...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
              ))}
            </select>
            {errors.category && <span className="create-report__error">{errors.category}</span>}
          </div>

          <div className="create-report__field">
            <label className="create-report__label">Descripción <span>*</span></label>
            <textarea
              className={`create-report__input create-report__textarea ${errors.description ? "create-report__input--error" : ""}`}
              placeholder="Describí el problema con el mayor detalle posible..."
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: "" })); }}
              rows={4}
              maxLength={600}
            />
            <span className="create-report__counter">{description.length}/600</span>
            {errors.description && <span className="create-report__error">{errors.description}</span>}
          </div>

          <div className="create-report__field">
            <label className="create-report__label">Dirección (opcional)</label>
            <input
              className="create-report__input"
              type="text"
              placeholder="Ej: Calle Falsa 123, Buenos Aires"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="create-report__field">
            <label className="create-report__label">
              Ubicación en el mapa
              <span className="create-report__label-hint"> — hacé clic para marcar</span>
            </label>
            <MapPicker value={location} onChange={setLocation} height="260px" />
            {location && (
              <span className="create-report__coords">
                📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            )}
          </div>

          <div className="create-report__field">
            <label className="create-report__label">Foto (opcional)</label>
            <label className="create-report__photo-label">
              <input type="file" accept="image/*" onChange={handlePhoto} hidden />
              {photo ? (
                <div className="create-report__photo-preview">
                  <img src={photo} alt="preview" />
                  <button type="button" className="create-report__photo-remove" onClick={() => setPhoto(null)}>✕</button>
                </div>
              ) : (
                <div className="create-report__photo-placeholder">
                  <span>📷</span>
                  <span>Hacé clic para subir una foto</span>
                </div>
              )}
            </label>
          </div>

          <div className="create-report__actions">
            <button type="button" className="create-report__btn create-report__btn--secondary" onClick={() => navigate(-1)}>
              Cancelar
            </button>
            <button type="submit" className="create-report__btn create-report__btn--primary">
              Publicar reporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
