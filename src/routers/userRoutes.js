import { Router } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/User.js";
import { authenticate } from "../middlewares/auth.js";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// POST /users/register
router.post("/register", async (req, res) => {
  try {
    // console.log(req.body);
    
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "username và password là bắt buộc" });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(409).json({ message: "username đã tồn tại" });
    }

    const user = await User.create({ username, password, role });
    res.status(201).json({ _id: user._id, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /users/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "username và password là bắt buộc" });
    }

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Thông tin đăng nhập không đúng" });
    }

    const token = jwt.sign(
      { _id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { _id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /users/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /users/me — cập nhật name, birthday
router.patch("/me", authenticate, async (req, res) => {
  try {
    const { name, birthday } = req.body;
    const update = {};

    if (name !== undefined) update.name = name;
    if (birthday !== undefined) update.birthday = birthday || null;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /users/me/avatar — upload ảnh đại diện
router.patch("/me/avatar", authenticate, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Chưa có file" });

    const currentUser = await User.findById(req.user._id);

    // Xóa avatar cũ trên Cloudinary nếu có
    if (currentUser.avatarPublicId) {
      await cloudinary.uploader.destroy(currentUser.avatarPublicId);
    }

    // Upload avatar mới
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "avatars" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl: result.secure_url, avatarPublicId: result.public_id },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
