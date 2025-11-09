// lmsistts\src\lib\fileUtils.ts

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      console.log("✅ FileReader success, base64 length:", result.length);
      resolve(result);
    };
    reader.onerror = (error) => {
      console.error("❌ FileReader error:", error);
      reject(new Error("Gagal membaca file"));
    };
  });
}

export function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:[^;]+;base64,/, "");
  return Buffer.from(base64Data, "base64");
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
