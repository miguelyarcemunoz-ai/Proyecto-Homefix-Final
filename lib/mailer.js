import nodemailer from 'nodemailer';

export async function sendResetEmail({ to, name, resetUrl }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    if (process.env.DEV_SHOW_RESET_LINK === 'true') return { delivered: false, preview: resetUrl };
    throw new Error('SMTP no configurado');
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Restablece tu contraseña de HomeFix',
    text: `Hola ${name}, abre este enlace para crear una nueva contraseña: ${resetUrl}. El enlace vence en 30 minutos.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>Recupera tu acceso a HomeFix</h2><p>Hola ${name}, recibimos una solicitud para cambiar tu contraseña.</p><p><a href="${resetUrl}" style="display:inline-block;background:#00a98f;color:white;padding:12px 18px;border-radius:8px;text-decoration:none">Crear nueva contraseña</a></p><p>Este enlace vence en 30 minutos.</p></div>`
  });
  return { delivered: true };
}
