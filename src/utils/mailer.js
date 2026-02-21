const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // true only if using port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// VERIFY CONNECTION 
transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP CONNECTION ERROR:", error);
  } else {
    console.log("SMTP SERVER READY");
  }
});

module.exports = transporter;