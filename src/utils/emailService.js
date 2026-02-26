const SibApiV3Sdk = require("sib-api-v3-sdk");

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async ({ to, subject, htmlContent }) => {
  try {
    await tranEmailApi.sendTransacEmail({
      sender: { email: process.env.EMAIL_FROM },
      to: [{ email: to }],
      subject,
      htmlContent,
    });

    console.log("Email sent to:", to);
  } catch (error) {
    console.error("Email sending failed:", error.response?.body || error.message);
  }
};

module.exports = sendEmail;