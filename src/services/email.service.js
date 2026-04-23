import nodemailer from "nodemailer";
import { config } from "../config/config.js";

let transporter;

if (config.email.clientId && config.email.clientSecret) {
    // OAuth2 configuration (likely for Gmail)
    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: config.email.user,
            clientId: config.email.clientId,
            clientSecret: config.email.clientSecret,
            refreshToken: config.email.refreshToken,
        }
    });
} else {
    // Standard SMTP configuration (e.g., Ethereal, SendGrid)
    transporter = nodemailer.createTransport({
        host: config.email.host || "smtp.ethereal.email",
        port: config.email.port || 587,
        secure: config.email.port == 465,
        auth: {
            user: config.email.user,
            pass: config.email.password
        }
    });
}

export const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"Auth System" <${config.email.user || "no-reply@authsystem.com"}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);
        
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log("Preview URL: %s", previewUrl);
        }
        
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        // Don't throw, just log so registration can proceed if email fails in dev
        // Or throw if you want strict verification
        // throw error; 
    }
};