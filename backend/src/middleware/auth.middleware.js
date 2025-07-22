import jwt from "jsonwebtoken";
import User from "../models/User.js"

export const protectRoute = async (req, res, next) => {
   
    try {
        const token = req.cookies.jwt;
        if(!token){
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

        if(!decodedToken){
            return res.status(401).json({message: "Unauthorized - Invalid token"});
        }

        const user = await User.findById(decodedToken.userId).select("-password");

        if(!user){
            return res.status(401).json({message: "Unauthorized - User not found"})
        }

        req.user = user;

        next(); // call the next part of the route

    } catch (error) {
        console.log("Error in protectedRoute middleware", error);
        res.status(500).json({ message: "Internal Server Error"});
    }
}