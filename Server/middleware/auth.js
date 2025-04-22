import jwt from "jsonwebtoken"

const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decodedata = jwt.verify(token, process.env.JWT_SECERT);
        req.userid = decodedata?.id;
        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
        return;
    }
}

export default auth;
