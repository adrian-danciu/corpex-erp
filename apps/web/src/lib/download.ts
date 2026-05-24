export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  URL.revokeObjectURL(url);
}

export function downloadUrl(url: string, filename?: string): void {
  const link = document.createElement("a");
  link.href = url;
  if (filename) {
    link.download = filename;
  }
  link.click();
}
