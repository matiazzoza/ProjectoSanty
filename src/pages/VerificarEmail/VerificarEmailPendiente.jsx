import { useState } from "react";
import { Link } from "react-router-dom";
import "./VerificarEmail.scss";

async function reenviarVerificacion(email) {
  const res = await fetch("http://localhost:3001/api/auth/reenviar-verificacion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Error al reenviar.");
}

export default function VerificarEmailPendiente() {
  const [email, setEmail]     = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function handleReenviar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await reenviarVerificacion(email);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
      setEnviado(true);
    }
  }

  return (
    <div className="verificar-email">
      <div className="verificar-email__card">
        <span className="verificar-email__icon">📧</span>
        <h1 className="verificar-email__title">Revisá tu correo</h1>
        <p className="verificar-email__text">
          Te enviamos un enlace de verificación. Hacé click en el enlace del correo para activar tu cuenta.
        </p>
        <p className="verificar-email__hint">
          Si no lo encontrás, revisá la carpeta de spam.
        </p>

        {!mostrarForm && !enviado && (
          <button className="verificar-email__reenvio-link" onClick={() => setMostrarForm(true)}>
            ¿No recibiste o perdiste el correo? Reenviarlo
          </button>
        )}

        {mostrarForm && !enviado && (
          <form className="verificar-email__reenvio-form" onSubmit={handleReenviar}>
            <input
              className="verificar-email__reenvio-input"
              type="email"
              placeholder="Ingresá tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <button className="verificar-email__reenvio-btn" type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Reenviar verificación"}
            </button>
          </form>
        )}

        {enviado && (
          <p className="verificar-email__reenvio-ok">
            ✅ Si el email está registrado y no verificado, recibirás el correo en unos minutos.
          </p>
        )}

        <Link to="/login" className="verificar-email__btn">
          Ir al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
