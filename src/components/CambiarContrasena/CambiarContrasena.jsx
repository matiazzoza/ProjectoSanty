import { useState } from "react";
import { useToast } from "../../controllers/ToastController";
import { cambiarContrasena } from "../../models/authModel";
import "./CambiarContrasena.scss";

export default function CambiarContrasena({ onClose }) {
  const { addToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast("Las contraseñas nuevas no coinciden.", "error");
      return;
    }
    if (newPassword.length < 6) {
      addToast("La nueva contraseña debe tener al menos 6 caracteres.", "error");
      return;
    }
    setLoading(true);
    try {
      await cambiarContrasena(currentPassword, newPassword);
      addToast("Contraseña actualizada correctamente.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose?.();
    } catch (err) {
      addToast(err.message || "Error al cambiar la contraseña.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cambiar-pwd">
      <h3 className="cambiar-pwd__title">Cambiar contraseña</h3>
      <form className="cambiar-pwd__form" onSubmit={handleSubmit}>
        <div className="cambiar-pwd__field">
          <label className="cambiar-pwd__label">Contraseña actual</label>
          <div className="cambiar-pwd__input-wrap">
            <input
              className="cambiar-pwd__input"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button type="button" className="cambiar-pwd__toggle" onClick={() => setShowCurrent((v) => !v)}>
              {showCurrent ? "Ocultar" : "Ver"}
            </button>
          </div>
        </div>

        <div className="cambiar-pwd__field">
          <label className="cambiar-pwd__label">Nueva contraseña</label>
          <div className="cambiar-pwd__input-wrap">
            <input
              className="cambiar-pwd__input"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button type="button" className="cambiar-pwd__toggle" onClick={() => setShowNew((v) => !v)}>
              {showNew ? "Ocultar" : "Ver"}
            </button>
          </div>
        </div>

        <div className="cambiar-pwd__field">
          <label className="cambiar-pwd__label">Confirmar nueva contraseña</label>
          <div className="cambiar-pwd__input-wrap">
            <input
              className="cambiar-pwd__input"
              type={showNew ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          className="cambiar-pwd__submit"
          type="submit"
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
        >
          {loading ? "Guardando..." : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
}
