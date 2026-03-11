import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Token không hợp lệ" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 1) {
    return res.status(403).json({ message: "Chỉ admin mới có quyền này" });
  }
  next();
};
