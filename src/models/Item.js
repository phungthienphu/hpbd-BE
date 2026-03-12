import mongoose from "mongoose";

const PRIORITY = ["low", "medium", "high", "very_high"];
const STATUS = ["todo", "in_progress", "resolve"];

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    priority: { type: String, enum: PRIORITY, default: "medium" },
    link: { type: String, default: "" },
    note: { type: String, default: "" },
    status: { type: String, enum: STATUS, default: "todo" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
  },
  { timestamps: true }
);

const Item = mongoose.model("Item", ItemSchema);

export default Item;
