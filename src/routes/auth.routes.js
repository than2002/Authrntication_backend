import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";


const authRouter = Router();

/**
 * POST /api/auth/register
 * Body: {name, email, password}
 */
authRouter.post("/register", authController.register);


/**
 * POST /api/auth/login
 */
authRouter.post("/login", authController.login);

/**
 * GET /api/auth/get-me
 */
authRouter.get("/get-me", protect, authController.getMe);


//**
// GET /api/auth/refresh-token
//  
// */
authRouter.get("/refresh-token", authController.refreshToken);
/**
 * POST /api/auth/logout
 */
authRouter.post("/logout", authController.logout);



/**
 * Get/ api /auth/logout-all
 * 
 * 
 */

authRouter.get("/logout-all", protect, authController.logoutAll);

/**
 * GET/api/auth/verify-email
 * Body: {email, otp}
 */

authRouter.post("/verify-email", authController.verifyEmail);


export default authRouter;


