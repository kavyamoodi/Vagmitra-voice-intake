/* Kajal: optional PDF text extraction. Uploaded files are read locally in the browser. */
window.VagmitraDocument = {
  async extractPdf(file) {
    if (!file || file.type !== "application/pdf") throw new Error("Please choose a PDF file.");
    if (!window.pdfjsLib) throw new Error("PDF reader library did not load. Check your internet connection.");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await window.pdfjsLib.getDocument({data}).promise;
    let text = "";
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ") + "\\n";
    }
    return text.trim();
  }
};
