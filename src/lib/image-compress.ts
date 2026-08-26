// Zmenšení fotek přímo v prohlížeči, aby se z formuláře daly odeslat i dvě
// desítky snímků z mobilu.
//
// Dřív se každá fotka zmenšila na pevných 1600 px / kvalitu 0.75, takže jedna
// vážila skoro půl megabajtu a do rozpočtu requestu se jich vešlo jen šest.
// Nově dostane každá fotka svůj díl z celkového rozpočtu a kvalita se snižuje
// jen tolik, aby se do něj vešla – dvacet fotek tak projde vždycky.

/** Postupné stupně zmenšení; jdeme od nejkvalitnějšího. */
const QUALITY_LADDER: ReadonlyArray<{ maxDimension: number; quality: number }> = [
  { maxDimension: 1600, quality: 0.75 },
  { maxDimension: 1600, quality: 0.6 },
  { maxDimension: 1280, quality: 0.6 },
  { maxDimension: 1280, quality: 0.48 },
  { maxDimension: 1024, quality: 0.48 },
  { maxDimension: 1024, quality: 0.38 },
  { maxDimension: 860, quality: 0.38 },
];

/** Menší soubory nemá smysl překódovávat. */
const SKIP_BELOW_BYTES = 320 * 1024;
/** Pod tuhle hranici fotku netlačíme, i kdyby byl rozpočet napjatý. */
const MIN_TARGET_BYTES = 90 * 1024;
/** Použije se, když volající rozpočet neurčí. */
const DEFAULT_TARGET_BYTES = 500 * 1024;

interface LadderStep {
  maxDimension: number;
  quality: number;
}

interface DecodedSource {
  width: number;
  height: number;
  drawable: CanvasImageSource;
  release: () => void;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
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

/**
 * `createImageBitmap` dekóduje mimo hlavní vlákno a spotřebuje výrazně méně
 * paměti – na telefonech s velkými fotkami je to rozdíl mezi „projde“ a „spadne“.
 */
async function decodeSource(file: File): Promise<DecodedSource | null> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        width: bitmap.width,
        height: bitmap.height,
        drawable: bitmap,
        release: () => bitmap.close(),
      };
    } catch {
      // Starší prohlížeč neumí volbu orientace – spadneme na klasický <img>.
    }
  }

  try {
    const image = await loadImageElement(file);
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      drawable: image,
      release: () => {},
    };
  } catch {
    return null;
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

function withJpegExtension(name: string) {
  return `${name.replace(/\.[^.]+$/, "")}.jpg`;
}

async function renderStep(source: DecodedSource, step: LadderStep): Promise<Blob | null> {
  const scale = Math.min(1, step.maxDimension / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return null;

  context.drawImage(source.drawable, 0, 0, width, height);
  return toBlob(canvas, step.quality);
}

/** Zmenší fotku tak, aby se vešla do `targetBytes`; při problému vrátí originál. */
async function compressToTarget(file: File, targetBytes: number): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }
  if (file.size <= Math.min(targetBytes, SKIP_BELOW_BYTES)) {
    return file;
  }

  const source = await decodeSource(file);
  if (!source) return file;

  try {
    let best: File | null = null;

    for (const step of QUALITY_LADDER) {
      const blob = await renderStep(source, step);
      if (!blob) break;

      const candidate = new File([blob], withJpegExtension(file.name), {
        type: "image/jpeg",
        lastModified: file.lastModified,
      });

      if (!best || candidate.size < best.size) {
        best = candidate;
      }
      if (candidate.size <= targetBytes) {
        break;
      }
    }

    return best && best.size < file.size ? best : file;
  } catch {
    return file;
  } finally {
    source.release();
  }
}

export interface CompressOptions {
  /** Kolik bajtů smí zabrat všechny fotky dohromady. */
  totalBudgetBytes?: number;
  onProgress?: (done: number, total: number) => void;
}

/**
 * Zmenší všechny fotky tak, aby se dohromady vešly do rozpočtu.
 *
 * Zpracováváme je od nejmenší: co malá fotka ze svého dílu nespotřebuje,
 * zbyde na ty velké, takže se zbytečně nezhorší kvalita celé série.
 */
export async function compressImages(
  files: File[],
  options: CompressOptions = {},
): Promise<File[]> {
  const total = files.length;
  if (total === 0) return [];

  const budget = options.totalBudgetBytes ?? total * DEFAULT_TARGET_BYTES;

  const bySizeAscending = files
    .map((file, index) => ({ file, index }))
    .sort((a, b) => a.file.size - b.file.size);

  const result = new Array<File>(total);
  let remainingBudget = budget;
  let remainingFiles = total;
  let done = 0;

  for (const { file, index } of bySizeAscending) {
    const target = Math.max(MIN_TARGET_BYTES, remainingBudget / remainingFiles);
    const compressed = await compressToTarget(file, target);

    result[index] = compressed;
    remainingBudget -= compressed.size;
    remainingFiles -= 1;
    done += 1;
    options.onProgress?.(done, total);
  }

  return result;
}
