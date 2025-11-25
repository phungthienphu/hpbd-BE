import { Router } from "express";
import cloudinary from "cloudinary";
import Folder from "../models/folder.js";
import Image from "../models/Image.js";

const router = Router();

/**
 * POST /syncAll
 * Đồng bộ toàn bộ folder + ảnh từ Cloudinary về MongoDB
 */
router.post("/All", async (req, res) => {
  try {
    let allImagesSynced = [];

    // 1️⃣ Lấy tất cả resource trên Cloudinary (type upload)
    let nextCursor = undefined;
    const allResources = [];

    do {
      const result = await cloudinary.v2.api.resources({
        type: "upload",
        max_results: 500,
        next_cursor: nextCursor,
      });

      allResources.push(...result.resources);
      nextCursor = result.next_cursor;
    } while (nextCursor);

    // 2️⃣ Tạo folder trong MongoDB nếu chưa có và map folderName -> folderId
    const foldersMap = {};
    for (const r of allResources) {
      const folderName = r.asset_folder; // dùng luôn folder path từ Cloudinary
      if (!folderName) continue; // bỏ qua nếu không có folder

      if (!foldersMap[folderName]) {
        let folder = await Folder.findOne({ name: folderName });
        if (!folder) {
          folder = await Folder.create({
            name: folderName,
            path: folderName.toLowerCase().replace(/\s+/g, "-"),
          });
        }
        foldersMap[folderName] = folder._id;
      }
    }

    // 3️⃣ Lưu ảnh vào folder tương ứng
    for (const r of allResources) {
      const folderName = r.asset_folder;
      if (!folderName) continue; // bỏ qua nếu không có folder

      const folderId = foldersMap[folderName];
      // Kiểm tra ảnh đã có chưa
      const exists = await Image.findOne({ cloudinaryId: r.public_id });
      if (!exists) {
        const img = await Image.create({
          cloudinaryId: r.public_id,
          url: r.secure_url,
          folderId,
          description: r.context?.custom?.description || "",
        });
        allImagesSynced.push(img);
      }
    }

    res.json({
      message: `Đồng bộ xong ${Object.keys(foldersMap).length} folder và ${
        allImagesSynced.length
      } ảnh`,
      folders: Object.keys(foldersMap),
      images: allImagesSynced,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
//đồng bộ từ cloudinary vào database
router.post("/", async (req, res) => {
  try {
    const { cloudFolder, mongoFolder } = req.body;
    if (!cloudFolder || !mongoFolder)
      return res
        .status(400)
        .json({ message: "cloudFolder và mongoFolder là bắt buộc" });

    // 1️⃣ Lấy hoặc tạo folder trong MongoDB
    let folder = await Folder.findOne({ name: mongoFolder });
    if (!folder) {
      folder = await Folder.create({
        name: mongoFolder,
        path: mongoFolder.toLowerCase().replace(/\s+/g, "-"),
      });
    }

    let syncedImages = [];
    let nextCursor = undefined;

    do {
      // 2️⃣ Lấy ảnh từ Cloudinary theo folder
      const result = await cloudinary.v2.api.resources({
        type: "upload",
        prefix: cloudFolder,
        max_results: 500,
        next_cursor: nextCursor,
      });

      nextCursor = result.next_cursor;

      for (const r of result.resources) {
        // 3️⃣ Kiểm tra xem ảnh đã tồn tại chưa
        const exists = await Image.findOne({ cloudinaryId: r.public_id });
        if (!exists) {
          const img = await Image.create({
            cloudinaryId: r.public_id,
            url: r.secure_url,
            folderId: folder._id,
            description: r.context?.custom?.description || "",
          });
          syncedImages.push(img);
        }
      }
    } while (nextCursor);

    res.json({
      message: `Đồng bộ xong ${syncedImages.length} ảnh vào folder "${mongoFolder}"`,
      images: syncedImages,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router;
