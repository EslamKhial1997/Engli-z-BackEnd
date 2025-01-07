const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config({ path: "config.env" });
const path = require("path");
// إعداد transporter لإرسال الإيميلات باستخدام Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.STAMP_USER_NAME,
    pass: process.env.STAMP_PASS,
  },
});

// دالة إرسال الإيميل مع رابط التحقق
async function sendVerificationEmail(toEmail, verificationToken, firstName) {
  const verificationLink = `http://localhost:3001/auth/restNewPassword/${verificationToken}`;

  const mailOptions = {
    from: process.env.STAMP_USER_NAME,
    to: toEmail,
    subject: "تغييركلمة السر الخاصة بحسابك على منصة Mr:Mazen",
    html: `
      <strong>
        <h3>مرحبًا ${firstName}</h3>
      </strong>
      <p>"لقد تلقينا طلبًا لاعادة تعيين كلمة السر الخاصة بك"</p>
      <h3>يرجى النقر على الرابط أدناه لتأكيد حسابك:</h3>
      <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">تأكيد حسابك</a>
      <p>هذا الرابط صالح لمدة 30 دقيقة من وقت الاستلام. شكرًا لك!</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent to:", toEmail);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = sendVerificationEmail;
