import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

export interface MediaStorageProvider {
  store(file: File): Promise<{
    storageKey: string;
    publicUrl: string;
    width: number;
    height: number;
  }>;
  remove(storageKey: string): Promise<void>;
}

export class LocalMediaStorageProvider implements MediaStorageProvider {
  private readonly directory = path.resolve(process.cwd(), "public", "owner-uploads");

  async store(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8_000_000)
      throw new Error("Use a JPG, PNG, or WebP image smaller than 8 MB.");
    const storageKey = `${randomUUID()}.webp`;
    const output = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "warning" })
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();
    const metadata = await sharp(output).metadata();
    if (!metadata.width || !metadata.height) throw new Error("The image dimensions are invalid.");
    await mkdir(this.directory, { recursive: true });
    await writeFile(path.join(this.directory, storageKey), output, { flag: "wx" });
    return {
      storageKey,
      publicUrl: `/owner-uploads/${storageKey}`,
      width: metadata.width,
      height: metadata.height,
    };
  }

  async remove(storageKey: string) {
    if (!/^[0-9a-f-]{36}\.webp$/.test(storageKey)) throw new Error("Invalid media key.");
    await unlink(path.join(this.directory, storageKey)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
