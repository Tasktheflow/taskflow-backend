const transporter = require("./mailer");

const sendEmail = async ({ to, subject, html }) => {
  if (!to) return;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Email sending failed:", error);
  }
};

module.exports = sendEmail;