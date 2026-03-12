import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

app.get("/", (req, res) => res.json({ message: "Backend is running" }));
app.use("/folders", folderRoutes);
app.use("/images", imageRoutes);
app.use("/sync", syncRoutes);
app.use("/users", userRoutes);
app.use("/items", itemRoutes);

export default app;
