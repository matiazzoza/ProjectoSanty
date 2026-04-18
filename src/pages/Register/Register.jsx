import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../controllers/AuthController";
import "./Register.scss";

export default function Register() {
  const [form, setForm] = useState({ name: "", username: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    const ok = await register(form.username, form.password, form.name);
    if (ok) navigate("/");
  }

  return (
    <div className="register">
      <div className="register__card">
        <div className="register__header">
          <span className="register__icon">🏙️</span>
          <h1 className="register__title">Crear cuenta</h1>
          <p className="register__subtitle">Unite a ReportaMuni y ayudá a mejorar tu municipio</p>
        </div>

        <form className="register__form" onSubmit={handleSubmit}>
          <div className="register__field">
            <label className="register__label">Nombre completo</label>
            <input
              className="register__input"
              type="text"
              name="name"
              placeholder="Ej: Juan García"
              value={form.name}
              onChange={handleChange}
              autoFocus
              required
            />
          </div>

          <div className="register__field">
            <label className="register__label">Nombre de usuario</label>
            <input
              className="register__input"
              type="text"
              name="username"
              placeholder="Ej: juangarcia"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="register__field">
            <label className="register__label">Contraseña</label>
            <div className="register__input-wrapper">
              <input
                className="register__input"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button type="button" className="register__eye" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
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

          <div className="register__field">
            <label className="register__label">Confirmar contraseña</label>
            <div className="register__input-wrapper">
              <input
                className="register__input"
                type={showConfirm ? "text" : "password"}
                name="confirm"
                placeholder="Repetí tu contraseña"
                value={form.confirm}
                onChange={handleChange}
                required
              />
              <button type="button" className="register__eye" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}>
                {showConfirm ? (
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

          {error && <p className="register__error">{error}</p>}

          <button className="register__submit" type="submit">
            Registrarme
          </button>
        </form>

        <p className="register__login">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  );
}
