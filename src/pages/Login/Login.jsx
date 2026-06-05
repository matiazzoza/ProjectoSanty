import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../controllers/AuthController";
import "./Login.scss";

const ERROR_NO_VERIFICADO = 'Debés verificar tu correo electrónico antes de iniciar sesión.';

async function reenviarVerificacion(email) {
  const res = await fetch("http://localhost:3001/api/auth/reenviar-verificacion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Error al reenviar.");
}

export default function Login() {
  const [username, setUsername]     = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailReenvio, setEmailReenvio] = useState("");
  const [reenvioEnviado, setReenvioEnviado] = useState(false);
  const [reenvioLoading, setReenvioLoading] = useState(false);
  const { login, error, setError } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const mensajeExito = location.state?.mensaje;

  const mostrarReenvio = error === ERROR_NO_VERIFICADO;

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await login(username, password);
    if (result === 'superadmin') navigate("/super-admin");
    else if (result === 'admin') navigate("/dashboard-admin");
    else if (result === 'empleado') navigate("/panel-empleado");
    else if (result) navigate("/tablero-reportes");
  }

  async function handleReenviar(e) {
    e.preventDefault();
    setReenvioLoading(true);
    try {
      await reenviarVerificacion(emailReenvio);
      setReenvioEnviado(true);
    } catch {
      // silencioso — no revelamos si el email existe
      setReenvioEnviado(true);
    } finally {
      setReenvioLoading(false);
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__header">
          <span className="login__icon">🏙️</span>
          <h1 className="login__title">ReportaMuni</h1>
          <p className="login__subtitle">Reportá problemas de tu municipio y apoyá los de tus vecinos</p>
        </div>

        <form className="login__form" onSubmit={handleSubmit}>
          <div className="login__field">
            <label className="login__label">Usuario</label>
            <input
              className="login__input"
              type="text"
              placeholder="Ingresá tu usuario"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); setReenvioEnviado(false); }}
              autoFocus
            />
          </div>

          <div className="login__field">
            <label className="login__label">Contraseña</label>
            <div className="login__input-wrapper">
              <input
                className="login__input"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresá tu contraseña"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); setReenvioEnviado(false); }}
              />
              <button type="button" className="login__eye" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
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

          {mensajeExito && <p className="login__success">{mensajeExito}</p>}
          {error && <p className="login__error">{error}</p>}

          {mostrarReenvio && (
            <div className="login__reenvio">
              {reenvioEnviado ? (
                <p className="login__reenvio-ok">✅ Si el email está registrado y no verificado, recibirás el correo en unos minutos.</p>
              ) : (
                <>
                  <p className="login__reenvio-texto">
                    Si no recibiste o perdiste el correo de verificación, ingresá tu email para reenviarlo.
                  </p>
                  <form className="login__reenvio-form" onSubmit={handleReenviar}>
                    <input
                      className="login__input"
                      type="email"
                      placeholder="tu@email.com"
                      value={emailReenvio}
                      onChange={(e) => setEmailReenvio(e.target.value)}
                      required
                    />
                    <button className="login__reenvio-btn" type="submit" disabled={reenvioLoading}>
                      {reenvioLoading ? "Enviando..." : "Reenviar verificación"}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          <button className="login__submit" type="submit">
            Ingresar
          </button>
        </form>

        <p className="login__register">
          ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
        </p>

        <p className="login__register">
          <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
        </p>

        <div className="login__hint">
          <p>Usuarios de prueba:</p>
          <div className="login__users">
            <span><strong>admin</strong> / admin123</span>
            <span><strong>vecino1</strong> / vecino123</span>
            <span><strong>vecino2</strong> / vecino123</span>
            <span><strong>empleado1</strong> / empleado123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
