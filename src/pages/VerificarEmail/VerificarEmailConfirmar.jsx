import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { verificarEmail } from "../../models/authModel";
import "./VerificarEmail.scss";

export default function VerificarEmailConfirmar() {
  const { token } = useParams();
  const [estado, setEstado] = useState("cargando"); // cargando | ok | error
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    verificarEmail(token)
      .then(() => setEstado("ok"))
      .catch(() => setEstado("error"));
  }, [token]);

  if (estado === "cargando") {
    return (
      <div className="verificar-email">
        <div className="verificar-email__card">
          <span className="verificar-email__icon">⏳</span>
          <h1 className="verificar-email__title">Verificando...</h1>
        </div>
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div className="verificar-email">
        <div className="verificar-email__card">
          <span className="verificar-email__icon">❌</span>
          <h1 className="verificar-email__title">Enlace inválido</h1>
          <p className="verificar-email__text">
            El enlace de verificación es inválido o ya fue utilizado.
          </p>
          <Link to="/login" className="verificar-email__btn">
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="verificar-email">
      <div className="verificar-email__card">
        <span className="verificar-email__icon">✅</span>
        <h1 className="verificar-email__title">¡Cuenta verificada!</h1>
        <p className="verificar-email__text">
          Tu cuenta fue activada correctamente. Ya podés iniciar sesión.
        </p>
        <Link to="/login" className="verificar-email__btn">
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
