import { useState } from "react";
import { Link } from "react-router-dom";
import "./RecuperarContrasena.scss";

export default function RecuperarContrasena() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/recuperar-contrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ocurrió un error.");
      } else {
        setEnviado(true);
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="recuperar">
      <div className="recuperar__card">
        <div className="recuperar__header">
          <span className="recuperar__icon">🔑</span>
          <h1 className="recuperar__title">Recuperar contraseña</h1>
          <p className="recuperar__subtitle">
            Ingresá tu email y te enviaremos un link para crear una nueva contraseña
          </p>
        </div>

        {enviado ? (
          <div className="recuperar__success">
            <span className="recuperar__success-icon">✅</span>
            <p>
              Si el email está registrado, recibirás un link en los próximos minutos.
              Revisá también la carpeta de spam.
            </p>
            <Link to="/login" className="recuperar__back">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form className="recuperar__form" onSubmit={handleSubmit}>
            <div className="recuperar__field">
              <label className="recuperar__label">Email</label>
              <input
                className="recuperar__input"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                autoFocus
                required
              />
            </div>

            {error && <p className="recuperar__error">{error}</p>}

            <button className="recuperar__submit" type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de recuperación"}
            </button>

            <Link to="/login" className="recuperar__link">
              ← Volver al inicio de sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
