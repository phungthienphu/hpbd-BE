import mongoose from "mongoose";

const FolderSchema = new mongoose.Schema(
  {
    folderName: { type: String, required: true },
    folder: { type: String, required: true },
    description: { type: String, default: "" },
    previewImage: { type: String, default: "" },
  },
  { timestamps: true, collection: "folders" }
);

export default mongoose.model("folders", FolderSchema);
