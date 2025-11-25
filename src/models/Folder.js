import mongoose from "mongoose";
const FolderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    path: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    previewImage: { type: String, default: "" },
  },
  { timestamps: true }
);
export default mongoose.model("Folder", FolderSchema);