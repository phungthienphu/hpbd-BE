import multer from "multer";
import { Router } from "express";
import Image from "../models/Image.js";
import Folder from "../models/Folder.js";
import cloudinary from "cloudinary";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // dùng buffer tạm
// POST /images/upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { folderName, description } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "Chưa có file" });

    // Lấy folder theo tên
    let folder = await Folder.findOne({ name: folderName });
    if (!folder) {
      folder = await Folder.create({
        name: folderName,
        path: folderName.toLowerCase(),
      });
    }
    // Upload lên Cloudinary
    const result = await cloudinary.v2.uploader.upload_stream(
      { folder: folder.name },
      async (error, result) => {
        if (error) return res.status(500).json({ message: error.message });

        const image = await Image.create({
          cloudinaryId: result.public_id,
          url: result.secure_url,
          folderId: folder._id,
          description: description || "",
        });

        res.status(201).json(image);
      }
    );

    // Ghi buffer vào stream
    const stream = result;
    stream.end(file.buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /images/sync
router.post("/sync", async (req, res) => {
  try {
    let folder = await Folder.findOne({ name: "All" });
    if (!folder) folder = await Folder.create({ name: "All", path: "all" });

    // Lấy tất cả ảnh trong Cloudinary
    const resources = await cloudinary.v2.api.resources({
      type: "upload",
      max_results: 500,
    });

    const results = [];
    for (const r of resources.resources) {
      const exists = await Image.findOne({ cloudinaryId: r.public_id });
      if (!exists) {
        const img = await Image.create({
          cloudinaryId: r.public_id,
          url: r.secure_url,
          folderId: folder._id,
          description: r.context?.custom?.description || "",
        });
        results.push(img);
      }
    }

    res.json({ synced: results.length, images: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//add munti
router.post("/add", upload.array("files", 50), async (req, res) => {
  try {
    const { folderId } = req.body;
    const files = req.files;

    if (!folderId) {
      return res.status(400).json({ message: "Thiếu folderId" });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Chưa gửi file" });
    }

    // Kiểm tra folder có tồn tại
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder không tồn tại" });
    }

    const uploadedImages = [];

    for (const file of files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: folder._id.toString() }, // dùng ID thay cho name
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      const image = await Image.create({
        cloudinaryId: result.public_id,
        url: result.secure_url,
        folderId: folder._id,
        description: "", // phase 1 để trống
      });

      uploadedImages.push(image);
    }

    res.status(201).json(uploadedImages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =====================
// Lấy ảnh theo folder
// GET /images/folder/:folderId
// =====================
router.get("/folder/:folderId", async (req, res) => {
  try {
    const { folderId } = req.params;
    const images = await Image.find({ folderId }).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =====================
// Xóa ảnh
// DELETE /images/:id
// =====================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);
    if (!image) return res.status(404).json({ message: "Ảnh không tồn tại" });

    // Xóa ảnh trên Cloudinary
    await cloudinary.v2.uploader.destroy(image.cloudinaryId);
    // Xóa ảnh trong DB
    await image.deleteOne();
    res.json({ message: "Ảnh đã được xóa" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/move", async (req, res) => {
  try {
    const { imageIds, idTransfer } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res
        .status(400)
        .json({ message: "imageIds phải là mảng không rỗng" });
    }

    if (!idTransfer) {
      return res
        .status(400)
        .json({ message: "idTransfer (folder đích) là bắt buộc" });
    }

    // Cập nhật folderId cho các ảnh cụ thể
    const result = await Image.updateMany(
      { _id: { $in: imageIds } },
      { $set: { folderId: idTransfer } }
    );

    res.json({
      message: `Đã di chuyển ${result.modifiedCount} ảnh sang folder ${idTransfer}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
