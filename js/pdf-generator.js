/* Khushi: create a review copy with jsPDF. Generated locally; not an official government document. */
window.VagmitraPdf = {
  download(answers) {
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error("PDF library did not load. Check your internet connection.");
    const doc = new window.jspdf.jsPDF();
    let y = 20;
    doc.setFontSize(18); doc.text("Vagmitra - Intake Summary", 15, y); y += 12;
    doc.setFontSize(10); doc.text("Prototype copy - please verify details before official submission.", 15, y); y += 12;
    Object.entries(answers).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase());
      const lines = doc.splitTextToSize(label + ": " + (value || "Not provided"), 175);
      if (y + lines.length * 6 > 280) { doc.addPage(); y = 20; }
      doc.text(lines, 15, y); y += lines.length * 6 + 4;
    });
    doc.save("vagmitra-intake-summary.pdf");
  }
};
