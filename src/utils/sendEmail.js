const transporter = require("./mailer");

const sendEmail = async ({ to, subject, html }) => {
  if (!to) return;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
