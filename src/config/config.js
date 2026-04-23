import dotenv from "dotenv";

dotenv.config();

if (!process.env.PORT || !process.env.MONGO_URI || !process.env.JWT_SECRET) {
    throw new Error("Please provide all the required environment variables");
}



export const config = {
    port: process.env.PORT,
    mongo_uri: process.env.MONGO_URI,
    jwt_secret: process.env.JWT_SECRET,
    email: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASS,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN
    }
};