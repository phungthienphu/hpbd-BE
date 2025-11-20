import { Router } from "express";
import { listFolders, listImagesInFolder } from "../services/cloudinaryService.js";

const router = Router();

router.get("/folders", async (req, res) => {
  try {
    // optional: support query ?root=PHU

    const root = req.query.root || "";
    console.log("root", root);
    const data = await listFolders(root);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/images", async (req, res) => {
  try {
    const folder = req.query.folder;
    if (!folder) return res.status(400).json({ error: "Missing folder param" });

    const data = await listImagesInFolder(folder);
    res.json({ folder, total: data.length, images: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
