import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cloudinaryRoutes from "./routers/cloudinary.js";
import connectDB from "./config/mongoose.js";
import imageRoutes from "./routers/imageRoutes.js";
import folderRoutes from "./routers/folderRoute.js";

connectDB();
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.json({ message: "Backend is running" }));
app.use("/folders", folderRoutes);
app.use("/cloudinary", cloudinaryRoutes);
app.use("/images", imageRoutes);


export default app;

