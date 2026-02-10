import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendStatusEmail = async ({ to, monitorName, url, status, reason }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const color = status === 'down' ? '#ef4444' : '#22c55e';
  await transporter.sendMail({
    from: `Uptime Sentinel <${process.env.SMTP_USER}>`,
    to,
    subject: `${monitorName} is ${status.toUpperCase()}`,
    html: `<div style="font-family:Arial,sans-serif;padding:16px">
      <h2 style="color:${color}">${monitorName} is currently ${status.toUpperCase()}</h2>
      <p><strong>URL:</strong> ${url}</p>
      <p><strong>Details:</strong> ${reason || 'No additional detail provided'}</p>
      <p>This alert was generated automatically by your uptime monitor.</p>
    </div>`
  });
};
