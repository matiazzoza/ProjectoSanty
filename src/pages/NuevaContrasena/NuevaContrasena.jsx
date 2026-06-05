import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./NuevaContrasena.scss";

export default function NuevaContrasena() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/auth/nueva-contrasena/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ocurrió un error.");
      } else {
        navigate("/login", { state: { mensaje: "Contraseña actualizada. Ya podés iniciar sesión." } });
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="nueva-pass">
      <div className="nueva-pass__card">
        <div className="nueva-pass__header">
          <span className="nueva-pass__icon">🔒</span>
          <h1 className="nueva-pass__title">Nueva contraseña</h1>
          <p className="nueva-pass__subtitle">Elegí una contraseña segura para tu cuenta</p>
        </div>

        <form className="nueva-pass__form" onSubmit={handleSubmit}>
          <div className="nueva-pass__field">
            <label className="nueva-pass__label">Nueva contraseña</label>
            <div className="nueva-pass__input-wrapper">
              <input
                className="nueva-pass__input"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                autoFocus
                required
              />
              <button
                type="button"
                className="nueva-pass__eye"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="nueva-pass__field">
            <label className="nueva-pass__label">Confirmar contraseña</label>
            <input
              className="nueva-pass__input"
              type={showPassword ? "text" : "password"}
              placeholder="Repetí la contraseña"
              value={confirmar}
              onChange={(e) => { setConfirmar(e.target.value); setError(""); }}
              required
            />
          </div>

          {error && <p className="nueva-pass__error">{error}</p>}

          <button className="nueva-pass__submit" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar nueva contraseña"}
          </button>

          <Link to="/login" className="nueva-pass__link">
            ← Volver al inicio de sesión
          </Link>
        </form>
      </div>
    </div>
  );
}
