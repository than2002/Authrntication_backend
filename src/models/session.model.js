import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    refreshTokenHash: {
        type: String,
        required: true,
        unique: true
    },
    ipAddress: { type: String },
    userAgent: {
        type: String
    },
    revoke: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }
    }
}, { timestamps: true });

const sessionModel = mongoose.model("Session", sessionSchema);

export default sessionModel;