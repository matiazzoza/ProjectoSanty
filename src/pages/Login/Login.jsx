import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.scss";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (login(username, password)) {
      navigate("/");
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
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              autoFocus
            />
          </div>

          <div className="login__field">
            <label className="login__label">Contraseña</label>
            <input
              className="login__input"
              type="password"
              placeholder="Ingresá tu contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
            />
          </div>

          {error && <p className="login__error">{error}</p>}

          <button className="login__submit" type="submit">
            Ingresar
          </button>
        </form>

        <div className="login__hint">
          <p>Usuarios de prueba:</p>
          <div className="login__users">
            <span><strong>admin</strong> / admin123</span>
            <span><strong>vecino1</strong> / vecino123</span>
            <span><strong>vecino2</strong> / vecino123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
