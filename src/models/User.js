import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: Number, enum: [0, 1], default: 0 }, // 0: user, 1: admin
    name: { type: String, default: "" },
    birthday: { type: Date, default: null },
    avatarUrl: { type: String, default: "" },
    avatarPublicId: { type: String, default: "" },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

const User = mongoose.model("User", UserSchema);

export default User;
