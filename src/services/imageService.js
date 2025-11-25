import Image from "../models/Image.js";
import { listImagesInFolder } from "./cloudinaryService.js";
import { listFolders } from "./cloudinaryService.js";

export async function syncFolderToDB(folder) {
  if (!folder) throw new Error("folder is required");

  const images = await listImagesInFolder(folder);
  const docs = [];

  for (const img of images) {
    const exists = await Image.findOne({ cloudinaryId: img.public_id });
    if (!exists) {
      const newImg = await Image.create({
        cloudinaryId: img.public_id,
        url: img.url,
        folder,
        description: "",
      });
      docs.push(newImg);
    }
  }

  return docs;
}

async function getAllFolders(root = "") {
  const folders = await listFolders(root);
  let allFolders = [];

  for (const folder of folders) {
    const folderPath = root ? `${root}/${folder.name}` : folder.name;
    allFolders.push(folderPath);
    const subFolders = await getAllFolders(folderPath);
    allFolders = allFolders.concat(subFolders);
  }

  return allFolders;
}

export async function syncAllFoldersToDB() {
  const allFolders = await getAllFolders();
  const addedImages = [];
  for (const folder of allFolders) {
    const images = await listImagesInFolder(folder);

    for (const img of images) {
      const exists = await Image.findOne({ cloudinaryId: img.public_id });
      if (!exists) {
        const newImg = await Image.create({
          cloudinaryId: img.public_id,
          url: img.url,
          folder,
          description: "",
        });
        addedImages.push(newImg);
      }
    }
  }

  return addedImages;
}

