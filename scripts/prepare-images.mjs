import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const sourceDirectory = process.argv[2] ?? path.join(homedir(), "Downloads");
const root = process.cwd();
const sources = [
  [
    "18_06_23 (1)",
    "balcony-sea-view",
    "Balconies",
    "Two chairs and a table on a balcony above olive trees and the sea.",
  ],
  [
    "18_06_23 (2)",
    "dressing-table",
    "Studios",
    "A wooden dressing table with a mirror and a small stool.",
  ],
  [
    "18_06_23 (3)",
    null,
    "Balconies",
    "Near-duplicate of photo 1; excluded from the public gallery.",
  ],
  [
    "18_06_24 (4)",
    "balcony-striped-chairs",
    "Balconies",
    "Striped chairs and a small table on a balcony with a sea view.",
  ],
  [
    "18_06_24 (5)",
    "studio-colourful-bed",
    "Studios",
    "A double bed with a colourful cover beside a wooden wardrobe.",
  ],
  [
    "18_06_24 (6)",
    "studio-blue-bed",
    "Studios",
    "A double bed with a blue cover beside floral curtains.",
  ],
  [
    "18_06_24 (7)",
    "studio-interior",
    "Studios",
    "A studio interior with a television, dressing table, and air conditioner.",
  ],
  [
    "18_06_24 (8)",
    "balcony-evening",
    "Balconies",
    "A table on a balcony seen through open doors in the evening light.",
  ],
  [
    "18_06_24 (9)",
    "studio-double-bed",
    "Studios",
    "A double bed against a pale blue wall beside a balcony door.",
  ],
  [
    "18_06_24 (10)",
    "studio-balcony-door",
    "Studios",
    "A blue bed cover and an open view of the sea through balcony doors.",
  ],
  [
    "18_06_42 (1)",
    "olive-grove",
    "Surroundings",
    "Olive trees and tall cypress trees above a blue sea.",
  ],
  [
    "18_06_42 (2)",
    "garden-steps",
    "Property",
    "Stone garden steps between white buildings with a sea view beyond.",
  ],
  [
    "18_06_42 (3)",
    "exterior-walkway",
    "Property",
    "Stone steps lead to an outdoor walkway and studio entrances.",
  ],
  [
    "18_06_42 (4)",
    "studio-building",
    "Property",
    "A white two-storey building with yellow trim and stone paths.",
  ],
  ["18_06_42 (5)", "coast-at-dusk", "Surroundings", "Beach umbrellas beside a bay at dusk."],
  ["18_06_42 (6)", "garden-path", "Property", "A narrow path under olive trees and red flowers."],
  ["18_06_42 (7)", "parking-area", "Property", "A parked car beside olive trees and a stone wall."],
  [
    "18_06_42 (8)",
    "coastal-cliffs",
    "Surroundings",
    "Pale rock cliffs and trees above deep blue water.",
  ],
  [
    "18_06_43 (9)",
    "turquoise-bay",
    "Surroundings",
    "Clear turquoise water below a pale cliff and a narrow beach.",
  ],
  [
    "18_06_44 (10)",
    "kitchenette",
    "Studios",
    "A kitchenette with wooden cupboards, a small fridge, and cooking equipment.",
  ],
];

await mkdir(path.join(root, "public/images"), { recursive: true });
await mkdir(path.join(root, "src/content"), { recursive: true });
await mkdir(path.join(root, "docs"), { recursive: true });
const photos = [];
const inventory = [];

for (const [index, [suffix, id, category, description]] of sources.entries()) {
  const filename = `ChatGPT Image 10. Sept. 2026, ${suffix}.png`;
  const original = await readFile(path.join(sourceDirectory, filename));
  const metadata = await sharp(original).metadata();
  const hash = createHash("sha256").update(original).digest("hex");
  inventory.push({
    number: index + 1,
    filename,
    id,
    width: metadata.width,
    height: metadata.height,
    bytes: original.length,
    sha256: hash,
  });
  if (!id) continue;
  const variants = [];
  for (const targetWidth of [640, 960, 1440]) {
    const output = `${id}-${targetWidth}.webp`;
    const info = await sharp(original)
      .rotate()
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(path.join(root, "public/images", output));
    variants.push({
      src: `/images/${output}`,
      width: info.width,
      height: info.height,
      bytes: info.size,
    });
  }
  photos.push({
    id,
    sourceNumber: index + 1,
    category,
    alt: description,
    width: metadata.width,
    height: metadata.height,
    variants,
  });
}

await writeFile(
  path.join(root, "src/content/photo-metadata.json"),
  JSON.stringify(photos, null, 2) + "\n",
);
const sourceBytes = inventory.reduce((total, item) => total + item.bytes, 0);
const derivativeBytes = photos
  .flatMap((photo) => photo.variants)
  .reduce((total, item) => total + item.bytes, 0);
const report = `# Photo inventory\n\nAll 20 supplied files were inspected. Photo 3 is a near-duplicate of photo 1 and is excluded. All source files remain unchanged in the supplied directory.\n\nThe public gallery has 19 photos. The photos show the supplied property and surroundings. They do not establish a map between photos and physical studios. Exterior stairs are visible. Do not infer step-free access, room capacity, parking rights, distances, or included services from these photos. The owner must verify image rights and that the files represent the current property before publication.\n\nRun \`node scripts/prepare-images.mjs /path/to/source-directory\` to rebuild the WebP files and metadata. The script strips metadata, keeps aspect ratios, and does not enlarge photos. It does not modify originals.\n\nSource size: ${(sourceBytes / 1024 / 1024).toFixed(2)} MiB. All derivatives: ${(derivativeBytes / 1024 / 1024).toFixed(2)} MiB.\n\n| Photo | Source file | Dimensions | Use | SHA-256 |\n| --- | --- | --- | --- | --- |\n${inventory.map((item) => `| ${item.number} | ${item.filename} | ${item.width} × ${item.height} | ${item.id ?? "Excluded: near-duplicate of 1"} | \`${item.sha256}\` |`).join("\n")}\n\nPhoto 1 is the main home image. Photo 14 is the property introduction image. Photo 8 is the second balcony image. Photos 15, 18, and 19 show surroundings; no specific beach name or distance is asserted. Demo studio pages use an explicitly labelled selection of general property photos.\n`;
await writeFile(path.join(root, "docs/PHOTO_INVENTORY.md"), report);
process.stdout.write(`Prepared ${photos.length} photos, ${photos.length * 3} derivatives.\n`);
