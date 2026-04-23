import crypto from "crypto";

export const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};
export function getOTPhtml(otp) {
    return `<!DOCTYPE html>
    <html>
    <head>
    <title>OTP Verification</title>
    <style>
        body{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .container{
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }   
    </style>
    </head> 
    <body>
    <div class="container">
    <h1>OTP Verification</h1>
    <p>Your OTP is: ${otp}</p>
    </div>
    </body>
    </html>`;
}

export const generateToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

