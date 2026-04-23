import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "../config/config.js";
import sessionModel from "../models/session.model.js";
import { sendEmail } from "../services/email.service.js";
import { generateOTP, getOTPhtml } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";

const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await userModel.findOne({ $or: [{ email }, { name }] });
        if (existingUser) {
            return res.status(409).json({ message: "User or email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await userModel.create({
            name,
            email,
            password: hashedPassword
        });

        // Generate tokens
        const accessToken = jwt.sign({ id: newUser._id }, config.jwt_secret, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ id: newUser._id }, config.jwt_secret, { expiresIn: "7d" });
        const refreshTokenHash = hashToken(refreshToken);

        // Create session for database visibility
        await sessionModel.create({
            userId: newUser._id,
            refreshTokenHash,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            revoke: false
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        const otp = generateOTP();
        const html = getOTPhtml(otp);
        const otpHashed = hashToken(otp);
        await sendEmail(newUser.email, "OTP Verification", html);
        await otpModel.create({
            user: newUser._id,
            otpHashed,
            expiresAt: Date.now() + 15 * 60 * 1000,
            isUsed: false
        });



        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                verify: newUser.verify
            },
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error("Error in registration:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        if (!user.verify) {
            return res.status(401).json({ message: "User not verified" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate tokens
        const accessToken = jwt.sign({ id: user._id }, config.jwt_secret, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ id: user._id }, config.jwt_secret, { expiresIn: "7d" });
        const refreshTokenHash = hashToken(refreshToken);

        // Create session
        await sessionModel.create({
            userId: user._id,
            refreshTokenHash,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            revoke: false
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
            accessToken
        });
    } catch (error) {
        console.error("Error in login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json({
            message: "User fetched successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                verify: user.verify
            }
        });
    } catch (error) {
        console.error("Error in getMe:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const refreshTokenHash = hashToken(refreshToken);
        const session = await sessionModel.findOne({ refreshTokenHash, revoke: false });
        if (!session) {
            return res.status(401).json({ message: "Invalid or revoked session" });
        }

        const decodedToken = jwt.verify(refreshToken, config.jwt_secret);
        const user = await userModel.findById(decodedToken.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const newRefreshToken = jwt.sign({ id: user._id }, config.jwt_secret, { expiresIn: "7d" });
        const newRefreshTokenHash = hashToken(newRefreshToken);

        // Update session
        session.refreshTokenHash = newRefreshTokenHash;
        await session.save();

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const accessToken = jwt.sign({ id: user._id }, config.jwt_secret, { expiresIn: "15m" });
        res.status(200).json({
            message: "Token refreshed successfully",
            accessToken
        });
    } catch (error) {
        console.error("Error in token refresh:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const refreshTokenHash = hashToken(refreshToken);
            await sessionModel.updateOne({ refreshTokenHash }, { revoke: true });
        }
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Error in logout:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const logoutAll = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const refreshTokenHash = hashToken(refreshToken);
            await sessionModel.updateOne({ refreshTokenHash }, { revoke: true });
        }
        const decodedToken = jwt.verify(refreshToken, config.jwt_secret);
        const user = await userModel.findById(decodedToken.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await sessionModel.updateMany({ userId: user._id, revoke: false }, { revoke: true });
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "All sessions logged out successfully" });
    } catch (error) {
        console.error("Error in logout:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const otpDoc = await otpModel.findOne({ email });
        if (!otpDoc) {
            return res.status(404).json({ message: "OTP not found" });
        }
        const user = await userModel.findById(otpDoc.user);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.verify) {
            return res.status(400).json({ message: "User already verified" });
        }
        if (otpDoc.expiresAt < Date.now()) {
            return res.status(400).json({ message: "OTP expired" });
        }
        const otpHashed = hashToken(otp);
        if (otpHashed !== otpDoc.otpHashed) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        user.verify = true;
        await user.save();
        otpDoc.isUsed = true;
        await otpDoc.save();
        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        console.error("Error in email verification:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
