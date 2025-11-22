import express from "express";
import Folder from "../models/folder.js";

const router = express.Router();

router.get("/preview", async (req, res) => {  
  try {
    const folders = await Folder.find().sort({ createdAt: -1 });
    res.json(folders);
  } catch (err) {
    console.error("Error fetching folders:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
