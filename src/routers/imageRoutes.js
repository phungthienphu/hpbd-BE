import express from "express";
import { syncFolderToDB, syncAllFoldersToDB } from "../services/imageService.js";
import Image from "../models/Image.js";

const router = express.Router();

router.post("/sync", async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/all", async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
router.post("/sync-all", async (req, res) => {
  try {
    const images = await syncAllFoldersToDB();
    res.json({ added: images.length, images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
export default router;
