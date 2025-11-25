// POST /folders

import multer from "multer";
import Folder from "../models/Folder.js";
import { Router } from "express";
import cloudinary from "cloudinary";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); 
router.post("/add", upload.single("preview"), async (req, res) => {
  try {
    const { name, description } = req.body;
    const file = req.file;
    const existing = await Folder.findOne({ name });
    if (existing) return res.status(400).json({ message: "Folder đã tồn tại" });

    let previewImageUrl = null;

    // Nếu người dùng có upload ảnh
    if (file) {
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: "folder-previews" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      previewImageUrl = uploaded.secure_url;
    }

    const folder = new Folder({
      name,
      path: name.toLowerCase().replace(/\s+/g, "-"),
      description,
      previewImage: previewImageUrl, // <-- lưu ảnh
    });

    await folder.save();
    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch(
  "/update/:id",
  upload.single("preview"), // hỗ trợ upload ảnh mới
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const file = req.file;

      const folder = await Folder.findById(id);
      if (!folder)
        return res.status(404).json({ message: "Folder không tồn tại" });

      // --- Update name ---
      if (name) {
        folder.name = name;
        folder.path = name.toLowerCase().replace(/\s+/g, "-");
      }

      // --- Update description ---
      if (description !== undefined) {
        folder.description = description;
      }

      // --- Update preview image nếu có file mới ---
      if (file) {
        // 1. Upload ảnh mới lên Cloudinary
        const uploaded = await new Promise((resolve, reject) => {
          const stream = cloudinary.v2.uploader.upload_stream(
            { folder: "folder-previews" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        });

        const newPreviewUrl = uploaded.secure_url;

        // 2. (Tùy chọn) Xóa ảnh preview cũ trên Cloudinary nếu có
        if (folder.previewImage) {
          try {
            // Lấy cloudinary public_id từ URL cũ
            const publicId = folder.previewImage
              .split("/")
              .slice(-1)[0]
              .split(".")[0];

            await cloudinary.v2.uploader.destroy(`folder-previews/${publicId}`);
          } catch (err) {
            console.warn("Không thể xóa ảnh cũ:", err.message);
          }
        }

        // 3. Lưu preview mới
        folder.previewImage = newPreviewUrl;
      }

      await folder.save();
      res.json(folder);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

//http://localhost:8888/folders/delete/1
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findByIdAndDelete(id);
    if (!folder)
      return res.status(404).json({ message: "Folder không tồn tại" });

    res.json({ message: "Folder đã được xóa", folder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//http://localhost:8888/folders/preview/1?previewImage=https://example.com/image.jpg

router.patch("/preview/:id", upload.single("preview"), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Chưa gửi file" });
    // Upload lên Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        { folder: "folder-previews" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });
    const folder = await Folder.findById(id);
    if (!folder)
      return res.status(404).json({ message: "Folder không tồn tại" });

    folder.previewImage = result.secure_url;
    await folder.save();

    res.json(folder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { sort = "createdAt", order = "desc" } = req.query;

    const folders = await Folder.find().sort({
      [sort]: order === "asc" ? 1 : -1,
    });
    res.json(folders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
