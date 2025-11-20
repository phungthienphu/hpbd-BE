import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cloudinaryRoutes from "./routers/cloudinary.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "Backend is running" }));

app.use("/cloudinary", cloudinaryRoutes);

export default app;

