import { Router } from "express";
import Item from "../models/Item.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";

const router = Router();

// Tất cả routes đều yêu cầu đăng nhập
router.use(authenticate);

// POST /items — user + admin đều tạo được
router.post("/", async (req, res) => {
  try {
    const { name, category, priority, link, note, status, group } = req.body;
    if (!name || !category) {
      return res.status(400).json({ message: "name và category là bắt buộc" });
    }

    if (group) {
      const g = await Group.findById(group);
      if (!g) return res.status(404).json({ message: "Nhóm không tồn tại" });
      const isMember = g.members.some((m) => m.equals(req.user._id));
      if (!isMember && req.user.role !== 1) {
        return res.status(403).json({ message: "Bạn không phải thành viên của nhóm này" });
      }
    }

    const item = await Item.create({
      name, category, priority, link, note, status,
      createdBy: req.user._id,
      group: group || null,
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /items — admin xem tất cả, user chỉ xem của mình + của admin
// Query params: category, priority, status
router.get("/", async (req, res) => {
  try {
    const { category, priority, status, createdBy, group } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;

    if (req.user.role === 1) {
      if (createdBy) filter.createdBy = createdBy;
      if (group) filter.group = group;
    } else {
      if (group) {
        // Filter theo nhóm cụ thể — kiểm tra user có phải member không
        const g = await Group.findById(group);
        if (!g) return res.status(404).json({ message: "Nhóm không tồn tại" });
        const isMember = g.members.some((m) => m.equals(req.user._id));
        if (!isMember) return res.status(403).json({ message: "Bạn không phải thành viên của nhóm này" });
        filter.group = group;
      } else {
        const [admins, myGroups] = await Promise.all([
          User.find({ role: 1 }).select("_id"),
          Group.find({ members: req.user._id }).select("_id"),
        ]);
        const adminIds = admins.map((a) => a._id);
        const myGroupIds = myGroups.map((g) => g._id);

        filter.$or = [
          { group: null, createdBy: { $in: [req.user._id, ...adminIds] } },
          { group: { $in: myGroupIds } },
        ];
      }
    }

    const items = await Item.find(filter)
      .populate("createdBy", "username role")
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /items/:id
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate("createdBy", "username role");
    if (!item) return res.status(404).json({ message: "Item không tồn tại" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /items/:id/group — gán item vào nhóm (hoặc gỡ khỏi nhóm nếu group=null)
router.patch("/:id/group", async (req, res) => {
  try {
    const { group } = req.body;

    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item không tồn tại" });

    const isOwner = item.createdBy.equals(req.user._id);
    if (!isOwner && req.user.role !== 1) {
      return res.status(403).json({ message: "Bạn không phải người tạo item này" });
    }

    if (group) {
      const g = await Group.findById(group);
      if (!g) return res.status(404).json({ message: "Nhóm không tồn tại" });

      const isMember = g.members.some((m) => m.equals(req.user._id));
      if (!isMember && req.user.role !== 1) {
        return res.status(403).json({ message: "Bạn không phải thành viên của nhóm này" });
      }
    }

    item.group = group || null;
    await item.save();

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /items/:id/status — chỉ admin mới tick được trạng thái
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["todo", "in_progress", "resolve"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `status phải là một trong: ${allowed.join(", ")}` });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Item không tồn tại" });

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /items/:id — cập nhật thông tin item (user + admin)
router.patch("/:id", async (req, res) => {
  try {
    const { name, category, priority, link, note } = req.body;
    const update = {};

    if (name !== undefined) update.name = name;
    if (category !== undefined) update.category = category;
    if (priority !== undefined) update.priority = priority;
    if (link !== undefined) update.link = link;
    if (note !== undefined) update.note = note;

    const item = await Item.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ message: "Item không tồn tại" });

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /items/:id — chỉ admin
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item không tồn tại" });
    res.json({ message: "Đã xóa item" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
