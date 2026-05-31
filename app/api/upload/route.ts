import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { hasDatabaseStorage, saveUploadToStorage } from "@/src/lib/server-storage";

const uploadsDir = path.join(process.cwd(), "public", "images", "uploads");

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9.-]/g, "-");
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const extension = path.extname(file.name) || ".jpg";
  const fileName = `${Date.now()}-${randomUUID()}-${sanitizeFileName(
    path.basename(file.name, extension)
  )}${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (hasDatabaseStorage()) {
    const storedUpload = await saveUploadToStorage({
      fileName,
      contentType: file.type || "application/octet-stream",
      content: buffer,
    });

    if (!storedUpload) {
      return NextResponse.json({ error: "Upload storage unavailable" }, { status: 500 });
    }

    return NextResponse.json({ url: storedUpload.url });
  }

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(filePath, buffer);

  return NextResponse.json({ url: `/images/uploads/${fileName}` });
}
