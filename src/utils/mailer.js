const nodemailer = require("nodemailer");
const sendEmail = require("./sendEmail");
const notify = require("./notify");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



const notifyAndEmail = async ({
  user,
  type,
  message,
  email,
  subject,
}) => {
  await notify({ user, type, message });

  if (email) {
    await sendEmail({
      to: email,
      subject,
      html: `<p>${message}</p>`,
    });
  }
};

module.exports = notifyAndEmail;


module.exports = transporter;
