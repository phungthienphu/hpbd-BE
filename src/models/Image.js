import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema(
  {
    cloudinaryId: { type: String, required: true },
    url: { type: String, required: true },
    folder: { type: String, required: true },
    description: { type: String, default: "" }, 
    folderName: { type: String, default: "" },
  },
  { timestamps: true, collection: "images" }
);

export default mongoose.model("Image", ImageSchema);
