import fs from "fs";
import path from "path";

export function getMdxSlugs(dir: string): string[] {
  const root = path.join(process.cwd(), "content", dir);
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function readMdxFile(dir: string, slug: string): string {
  const fp = path.join(process.cwd(), "content", dir, `${slug}.mdx`);
  return fs.readFileSync(fp, "utf-8");
}
