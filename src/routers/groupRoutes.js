import { Router } from "express";
import Group from "../models/Group.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { friendlyError } from "../utils/errorHandler.js";

const router = Router();

router.use(authenticate);

// POST /groups — tạo nhóm, tự động thêm người tạo vào members
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Tên nhóm là bắt buộc" });

    const group = await Group.create({
      name,
      members: [req.user._id],
      createdBy: req.user._id,
    });

    res.status(201).json(group);
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

// GET /groups — danh sách nhóm tôi đang tham gia
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate("members", "username name avatarUrl")
      .populate("createdBy", "username name")
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

// GET /groups/:id — chi tiết nhóm (phải là thành viên hoặc admin)
router.get("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("members", "username name avatarUrl")
      .populate("createdBy", "username name");

    if (!group) return res.status(404).json({ message: "Nhóm không tồn tại" });

    const isMember = group.members.some((m) => m._id.equals(req.user._id));
    if (!isMember && req.user.role !== 1) {
      return res.status(403).json({ message: "Bạn không phải thành viên của nhóm này" });
    }

    res.json(group);
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

// POST /groups/:id/members — thêm thành viên (thành viên hoặc admin đều được)
router.post("/:id/members", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId là bắt buộc" });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Nhóm không tồn tại" });

    const isMember = group.members.some((m) => m.equals(req.user._id));
    if (!isMember && req.user.role !== 1) {
      return res.status(403).json({ message: "Bạn không phải thành viên của nhóm này" });
    }

    if (group.members.some((m) => m.equals(userId))) {
      return res.status(409).json({ message: "Người dùng đã trong nhóm" });
    }

    group.members.push(userId);
    await group.save();

    await group.populate("members", "username name avatarUrl");
    res.json(group);
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

// DELETE /groups/:id/members/:userId — xóa thành viên (chỉ người tạo hoặc admin)
router.delete("/:id/members/:userId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Nhóm không tồn tại" });

    const isCreator = group.createdBy.equals(req.user._id);
    if (!isCreator && req.user.role !== 1) {
      return res.status(403).json({ message: "Chỉ người tạo nhóm hoặc admin mới được xóa thành viên" });
    }

    if (group.createdBy.equals(req.params.userId)) {
      return res.status(400).json({ message: "Không thể xóa người tạo nhóm" });
    }

    group.members = group.members.filter((m) => !m.equals(req.params.userId));
    await group.save();

    res.json({ message: "Đã xóa thành viên" });
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

// DELETE /groups/:id — xóa nhóm (chỉ người tạo hoặc admin)
router.delete("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Nhóm không tồn tại" });

    const isCreator = group.createdBy.equals(req.user._id);
    if (!isCreator && req.user.role !== 1) {
      return res.status(403).json({ message: "Chỉ người tạo nhóm hoặc admin mới được xóa nhóm" });
    }

    await group.deleteOne();
    res.json({ message: "Đã xóa nhóm" });
  } catch (err) {
    const { status, message } = friendlyError(err);
    res.status(status).json({ message });
  }
});

export default router;
