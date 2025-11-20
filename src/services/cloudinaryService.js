import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
/**
 * Cloudinary config uses env variables:
 * CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * List subfolders of a root folder.
 * If root === "" then returns top-level folders (root_folders).
 * If root provided (e.g. "PHU") returns sub_folders inside that root.
 */
export async function listFolders(root = "") {
  
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("CLOUDINARY config is missing");
  }

  if (!root) {
    // top-level root folders
    try {
      const res = await cloudinary.api.root_folders();
      // res.folders => [{ name, path }]
      return res.folders || [];
    } catch (err) {
      console.error("error listFolders", err);
      return [];
    }
  } else {
    // subfolders of a given folder
    try {
      // console.log("cloudinary.api.sub_folders", root);
      const res = await cloudinary.api.sub_folders(root);
      // console.log("res listFolders", res);
      return res.folders || [];
    } catch (err) {
      console.error("error listFolders", err);
      return [];
    }
  }
}
export async function listFoldersWithPreview(root = "") {
  // lấy danh sách folder như cũ
  const folders = await listFolders(root);

  // lặp qua từng folder và lấy 1 ảnh bất kỳ
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

/**
 * List images (and videos) inside folder prefix.
 * folder should be like: "PHU/Album1" or "PHU/Album1/sub"
 */
export async function listImagesInFolder(folder) {
  if (!folder) throw new Error("folder is required");

  // Use search API for more flexible query (and to include videos/images)
  // Alternative: cloudinary.api.resources({ prefix: `${folder}/` })
  const results = await cloudinary.search
    .expression(`folder:${folder}`)
    .sort_by("public_id", "asc")
    .max_results(500)
    .execute();

  // results.resources contains items with secure_url
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
