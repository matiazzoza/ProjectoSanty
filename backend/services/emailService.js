const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
});

async function enviarVerificacion(email, nombre, token) {
  const link = `http://localhost:5173/verificar-email/${token}`;

  await transporter.sendMail({
    from: '"ReportaMuni 🏙️" <reportamunifsa@gmail.com>',
    to: email,
    subject: 'Verificá tu cuenta en ReportaMuni',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 2.5rem;">🏙️</span>
          <h1 style="color: #1e293b; margin: 8px 0 4px;">ReportaMuni</h1>
          <p style="color: #64748b; margin: 0;">Sistema Municipal de Reportes — Formosa</p>
        </div>
        <div style="background: #fff; border-radius: 10px; padding: 28px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">¡Hola, ${nombre}!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Gracias por registrarte en ReportaMuni. Para activar tu cuenta y empezar a reportar problemas en tu municipio, hacé click en el botón de abajo.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${link}" style="background: #2563eb; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
              Verificar mi cuenta
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin-bottom: 0;">
            Si no creaste esta cuenta, podés ignorar este correo. El enlace expira en 24 horas.
          </p>
        </div>
        <p style="text-align: center; color: #cbd5e1; font-size: 12px; margin-top: 20px;">
          © 2026 ReportaMuni · Municipalidad de Formosa
        </p>
      </div>
    `,
  });
}

async function enviarRecuperacion(email, nombre, token) {
  const link = `http://localhost:5173/nueva-contrasena/${token}`;

  await transporter.sendMail({
    from: '"ReportaMuni 🏙️" <reportamunifsa@gmail.com>',
    to: email,
    subject: 'Recuperá tu contraseña en ReportaMuni',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 2.5rem;">🏙️</span>
          <h1 style="color: #1e293b; margin: 8px 0 4px;">ReportaMuni</h1>
          <p style="color: #64748b; margin: 0;">Sistema Municipal de Reportes — Formosa</p>
        </div>
        <div style="background: #fff; border-radius: 10px; padding: 28px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">¡Hola, ${nombre}!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé click en el botón de abajo para crear una nueva contraseña.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${link}" style="background: #2563eb; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
              Restablecer contraseña
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin-bottom: 0;">
            Si no solicitaste esto, podés ignorar este correo. El enlace expira en 1 hora.
          </p>
        </div>
        <p style="text-align: center; color: #cbd5e1; font-size: 12px; margin-top: 20px;">
          © 2026 ReportaMuni · Municipalidad de Formosa
        </p>
      </div>
    `,
  });
}

module.exports = { enviarVerificacion, enviarRecuperacion };
