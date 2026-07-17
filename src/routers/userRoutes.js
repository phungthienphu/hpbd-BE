import { Router } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { friendlyError } from "../utils/errorHandler.js";

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
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
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
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

// GET /users — chỉ admin, trả danh sách user
router.get("/", authenticate, requireAdmin, async (_req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

// GET /users/search?q=... — tất cả role, tìm theo username hoặc name
router.get("/search", authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
    }).select("-password").limit(20);

    res.json(users);
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

// GET /users/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json(user);
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
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
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

// GET /users/face/status — kiểm tra user hiện tại đã đăng ký khuôn mặt chưa
router.get("/face/status", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("faceDescriptor");
    res.json({ hasFace: user.faceDescriptor.length === 128 });
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

// POST /users/face/register — lưu face descriptor cho user đang đăng nhập
router.post("/face/register", authenticate, async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({ message: "faceDescriptor phải là mảng 128 số" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { faceDescriptor },
      { new: true }
    ).select("-password");

    res.json({ message: "Đã lưu khuôn mặt thành công", user });
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

// PUT /users/face/register — cập nhật face descriptor (ghi đè)
router.put("/face/register", authenticate, async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({ message: "faceDescriptor phải là mảng 128 số" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { faceDescriptor },
      { new: true }
    ).select("-password -faceDescriptor");

    res.json({ message: "Đã cập nhật khuôn mặt thành công", user });
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

// DELETE /users/face — xóa face descriptor của user hiện tại
router.delete("/face", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("faceDescriptor");
    if (!user.faceDescriptor.length) {
      return res.status(404).json({ message: "Chưa đăng ký khuôn mặt" });
    }

    await User.findByIdAndUpdate(req.user._id, { faceDescriptor: [] });
    res.json({ message: "Đã xóa khuôn mặt thành công" });
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

// POST /users/face/login — đăng nhập bằng face descriptor
router.post("/face/login", async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({ message: "faceDescriptor phải là mảng 128 số" });
    }

    const users = await User.find({ faceDescriptor: { $exists: true, $not: { $size: 0 } } });
    if (!users.length) {
      return res.status(401).json({ message: "Chưa có tài khoản nào đăng ký khuôn mặt" });
    }

    const THRESHOLD = 0.5;
    let bestMatch = null;
    let bestDistance = Infinity;

    for (const u of users) {
      const dist = Math.sqrt(
        u.faceDescriptor.reduce((sum, val, i) => sum + (val - faceDescriptor[i]) ** 2, 0)
      );
      if (dist < bestDistance) {
        bestDistance = dist;
        bestMatch = u;
      }
    }

    if (!bestMatch || bestDistance >= THRESHOLD) {
      return res.status(401).json({ message: "Không nhận diện được khuôn mặt" });
    }

    const token = jwt.sign(
      { _id: bestMatch._id, username: bestMatch.username, role: bestMatch.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { _id: bestMatch._id, username: bestMatch.username, role: bestMatch.role },
    });
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
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
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

export default router;
