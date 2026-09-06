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
    try {
      const storedUpload = await saveUploadToStorage({
        fileName,
        contentType: file.type || "application/octet-stream",
        content: buffer,
      });

      if (storedUpload) {
        return NextResponse.json({ url: storedUpload.url });
      }
    } catch (error) {
      console.error("[upload] Uložení obrázku do databáze selhalo.", error);
    }

    return NextResponse.json(
      { error: "Obrázek se nepodařilo uložit do databáze. Zkuste to prosím znovu." },
      { status: 503 },
    );
  }

  // Zápis na disk funguje jen ve vývoji – na Vercelu je souborový systém
  // read-only, proto se chyba převede na srozumitelnou hlášku místo pádu.
  try {
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(filePath, buffer);
  } catch (error) {
    console.error("[upload] Zápis obrázku na disk selhal.", error);
    return NextResponse.json(
      { error: "Úložiště obrázků není nastavené (chybí databáze). Obrázek nelze uložit." },
      { status: 503 },
    );
  }

  return NextResponse.json({ url: `/images/uploads/${fileName}` });
}
