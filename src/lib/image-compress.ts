// Zmenšení fotek v prohlížeči, aby se z formuláře daly odeslat i desítky
// snímků z mobilu a e-mail nepřerostl limit přílohy.

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.75;
/** Menší soubory nemá smysl překódovávat. */
const SKIP_BELOW_BYTES = 400 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be decoded"));
    };
    image.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", JPEG_QUALITY);
  });
}

function withJpegExtension(name: string) {
  return `${name.replace(/\.[^.]+$/, "")}.jpg`;
}

/** Vrátí zmenšenou kopii fotky; při jakémkoli problému vrátí původní soubor. */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }
  if (file.size <= SKIP_BELOW_BYTES) {
    return file;
  }

  try {
    const image = await loadImage(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }
    context.drawImage(image, 0, 0, width, height);

    const blob = await toBlob(canvas);
    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File([blob], withJpegExtension(file.name), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

export async function compressImages(files: File[]): Promise<File[]> {
  const result: File[] = [];
  for (const file of files) {
    result.push(await compressImage(file));
  }
  return result;
}
