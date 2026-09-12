export async function readPolicyFile(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Choose a document smaller than 5 MB.");
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    const text = await file.text();
    if (text.length > 40000)
      throw new Error("Keep source text below 40,000 characters.");
    return text;
  }
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 30)
      throw new Error("Choose a focused policy of 30 pages or fewer.");
    const pages: string[] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      pages.push(
        content.items.map((item) => ("str" in item ? item.str : "")).join(" "),
      );
    }
    const text = pages.join("\n\n");
    if (!text.trim())
      throw new Error(
        "This PDF has no selectable text. Paste its transcribed policy text instead.",
      );
    if (text.length > 40000)
      throw new Error(
        "Choose a shorter policy or paste the relevant section (40,000 characters maximum).",
      );
    return text;
  } finally {
    await task.destroy();
  }
}
