export function friendlyError(err) {
  const msg = err.message || "";

  if (msg.includes("buffering timed out") || msg.includes("ECONNREFUSED")) {
    return { status: 503, message: "Không thể kết nối máy chủ, vui lòng thử lại sau" };
  }
  if (err.name === "ValidationError") {
    const detail = Object.values(err.errors).map((e) => e.message).join(", ");
    return { status: 400, message: detail };
  }
  if (err.code === 11000) {
    return { status: 409, message: "Dữ liệu đã tồn tại" };
  }
  if (err.name === "CastError") {
    return { status: 400, message: "Dữ liệu không hợp lệ" };
  }
  if (msg.includes("Must supply api_key") || msg.includes("cloudinary")) {
    return { status: 500, message: "Không thể tải ảnh lên, vui lòng thử lại sau" };
  }

  return { status: 500, message: "Đã có lỗi xảy ra, vui lòng thử lại sau" };
}
