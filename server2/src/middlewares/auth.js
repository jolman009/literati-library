import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const token = (req.headers["authorization"] || "").split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
    req.user = decoded;
    return next();
  } catch (e) {
    console.error("Token verification failed:", e);
    return res.status(403).json({ error: "Invalid token" });
  }
};

export default authenticateToken;
