import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema(
  {
    cloudinaryId: { type: String, required: true },
    url: { type: String, required: true },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      required: true,
    },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

// Tạo model
const Image = mongoose.model("Image", ImageSchema);

// Export model
export default Image;
