import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
export async function listFolders(root = "") {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("CLOUDINARY config is missing");
  }

  if (!root) {
    try {
      const res = await cloudinary.api.root_folders();
      return res.folders || [];
    } catch (err) {
      console.error("error listFolders", err);
      return [];
    }
  } else {
    try {
      const res = await cloudinary.api.sub_folders(root);
      // console.log("res listFolders", res);
      return res.folders || [];
    } catch (err) {
      console.error("error listFolders", err);
      return [];
    }
  }
}
//tạm thời bỏ
export async function listFoldersWithPreview(root = "") {
  const folders = await listFolders(root);
  const result = await Promise.all(
    folders.map(async (folder) => {
      const folderPath = root ? `${root}/${folder.name}` : folder.name;

      try {
        const searchResult = await cloudinary.search
          .expression(`folder:${folderPath}`)
          .max_results(1) // lấy 1 ảnh
          .execute();

        const preview =
          searchResult.resources?.[0]?.secure_url || null;

        return {
          ...folder,
          previewImage: preview,
        };
      } catch (err) {
        console.error("error fetching preview for", folderPath, err);
        return { ...folder, previewImage: null };
      }
    })
  );

  return result;
}

export async function listImagesInFolder(folder) {
  if (!folder) throw new Error("folder is required");
  const results = await cloudinary.search
    .expression(`folder:${folder}`)
    .sort_by("public_id", "asc")
    .max_results(500)
    .execute();

  const resources = results.resources || [];
  return resources.map((r) => ({
    public_id: r.public_id,
    url: r.secure_url,
    format: r.format,
    resource_type: r.resource_type,
    width: r.width,
    height: r.height,
  }));
}
