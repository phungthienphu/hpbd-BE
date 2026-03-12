import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { friendlyError } from "./utils/errorHandler.js";
import connectDB from "./config/mongoose.js";
import "./config/cloudinary.js";
import imageRoutes from "./routers/imageRoutes.js";
import folderRoutes from "./routers/folderRoute.js";
import syncRoutes from "./routers/sync.js";
import userRoutes from "./routers/userRoutes.js";
import itemRoutes from "./routers/itemRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kiểm tra kết nối DB trước khi xử lý request
// app.use((_req, res, next) => {
//   if (mongoose.connection.readyState !== 1) {
//     return res.status(503).json({ message: "Máy chủ chưa sẵn sàng, vui lòng thử lại sau" });
//   }
//   next();
// });

app.get("/", (req, res) => res.json({ message: "Backend is running" }));
app.use("/folders", folderRoutes);
app.use("/images", imageRoutes);
app.use("/sync", syncRoutes);
app.use("/users", userRoutes);
app.use("/items", itemRoutes);

// Global error handler
app.use((err, req, res, _next) => {
  console.error(err);
  const { status, message } = friendlyError(err);
  res.status(status).json({ message });
});

export default app;
