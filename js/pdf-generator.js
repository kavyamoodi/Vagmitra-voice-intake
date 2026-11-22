/* Khushi: builds the "Vagmitra Application" PDF from the answers collected in
 * the session.
 *
 * The document is created in the browser and saved straight to the user's
 * device with a temporary blob URL. It is never uploaded, and the temporary
 * URL is released again as soon as the download has been handed over.
 *
 * The PDF uses the real application data: the field list comes from
 * js/questions.js and the values come from the answers object the dialogue
 * controller holds, so the document always shows exactly what the user
 * entered and corrected.
 */
(() => {
  "use strict";

  const FILE_NAME = "Vagmitra_Application.pdf";
  const TITLE = "Vagmitra Application";
  const SUBTITLE = "Assistive Voice-Driven Intake System for Public Digital Portals";
  const NOTICE = "Prototype copy - not an official government document. Please verify every detail and submit only through the relevant official portal.";
  const FOOTER = "Vagmitra prototype - not an official government document.";

  /* The colour palette of the interface, so the document looks like the app. */
  const COLORS = {
    ink: [24, 42, 53],
    muted: [113, 129, 138],
    teal: [8, 127, 121],
    mint: [233, 246, 243],
    line: [229, 236, 235],
    white: [255, 255, 255],
    noticeFill: [255, 248, 233],
    noticeLine: [243, 223, 184],
    noticeText: [120, 99, 62]
  };

  /* Page geometry in millimetres (A4). */
  const PAGE = {
    margin: 16,
    bandHeight: 29,
    firstTop: 40,
    continuationTop: 22,
    bottom: 276
  };

  const PT_TO_MM = 0.352778;

  /* Characters that the PDF font cannot show, replaced by a readable
   * equivalent before they are dropped. */
  const CHARACTER_REPLACEMENTS = new Map([
    ["ΓÇÿ", "'"], ["ΓÇÖ", "'"], ["ΓÇÜ", "'"], ["ΓÇ¢", "'"],
    ["ΓÇ£", '"'], ["ΓÇ¥", '"'], ["ΓÇ₧", '"'], ["ΓÇƒ", '"'],
    ["ΓÇÉ", "-"], ["ΓÇæ", "-"], ["ΓÇÆ", "-"], ["ΓÇô", "-"], ["ΓÇö", "-"], ["ΓÇò", "-"],
    ["ΓêÆ", "-"], ["ΓÇª", "..."], ["ΓÇó", "-"], ["┬á", " "],
    ["ΓÇï", ""], ["ΓÇî", ""], ["ΓÇì", ""], ["Γüá", ""], ["∩╗┐", ""],
    ["ΓåÆ", "->"], ["Γäó", "(TM)"], ["Γé¼", "EUR"]
  ]);

  /* ------------------------------------------------------------- utilities */

  /* The PDF font (Helvetica / WinAnsi) can show these code points. */
  function isRenderable(code) {
    return (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff);
  }

  /* Removes control characters and replaces every character the PDF font
   * cannot show, so no answer is silently lost. The number of dropped
   * characters is reported back so the user can be told which fields need a
   * second look. */
  function sanitizeText(value) {
    const scrubbed = window.VagmitraPrivacy ? window.VagmitraPrivacy.scrubText(value) : String(value || "");
    let removed = 0;
    let output = "";

    for (const character of scrubbed) {
      const replacement = CHARACTER_REPLACEMENTS.get(character);
      if (replacement !== undefined) {
        output += replacement;
        continue;
      }
      if (isRenderable(character.codePointAt(0))) {
        output += character;
        continue;
      }
      removed += 1;
      output += "?";
    }
    return { text: output, removed: removed };
  }

  /* Local date and time of the moment the document was created. */
  function formatTimestamp(date) {
    try {
      return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    } catch (error) {
      return date.toLocaleString();
    }
  }

  /* Height of one line of text, in millimetres. */
  function lineHeight(layout, size) {
    return size * PT_TO_MM * layout.lineFactor;
  }

  /* Wraps text to the given width. jsPDF measures with the font that is set
   * at the moment of the call, so the font is set first. */
  function wrapText(doc, text, width, size, style) {
    doc.setFont("helvetica", style || "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(String(text == null ? "" : text), width);
    return Array.isArray(lines) && lines.length ? lines : [""];
  }

  /* ---------------------------------------------------------------- layout */

  function createLayout(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const lineFactor = typeof doc.getLineHeightFactor === "function" ? doc.getLineHeightFactor() : 1.15;
    return {
      doc: doc,
      pageWidth: pageWidth,
      pageHeight: pageHeight,
      left: PAGE.margin,
      right: pageWidth - PAGE.margin,
      width: pageWidth - PAGE.margin * 2,
      top: PAGE.bottom,
      bottom: PAGE.bottom,
      lineFactor: lineFactor,
      y: 0
    };
  }

  /* Starts the headline band on page one and a short running head on the
   * following pages. */
  function startPage(layout, first) {
    const doc = layout.doc;
    if (first) {
      doc.setFillColor(COLORS.teal[0], COLORS.teal[1], COLORS.teal[2]);
      doc.rect(0, 0, layout.pageWidth, PAGE.bandHeight, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
      doc.text(TITLE, layout.left, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(198, 228, 226);
      doc.text(SUBTITLE, layout.left, 22);
      layout.y = PAGE.firstTop;
      return;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(COLORS.teal[0], COLORS.teal[1], COLORS.teal[2]);
    doc.text(TITLE, layout.left, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text("Continued", layout.right, 12, { align: "right" });
    doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
    doc.setLineWidth(0.3);
    doc.line(layout.left, 15, layout.right, 15);
    layout.y = PAGE.continuationTop;
  }

  /* Moves to a new page when the given height does not fit on the current
   * one. Returns true when a page was added. */
  function ensureSpace(layout, needed) {
    if (layout.y + needed <= layout.bottom) return false;
    layout.doc.addPage();
    startPage(layout, false);
    return true;
  }

  /* Draws a block of already wrapped lines and moves the cursor down. A line
   * that does not fit starts a new page, so text is never cut off. */
  function drawLines(layout, lines, options) {
    const doc = layout.doc;
    const size = options.size || 10;
    const style = options.style || "normal";
    const color = options.color || COLORS.ink;
    const x = options.x === undefined ? layout.left : options.x;
    const height = lineHeight(layout, size);

    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);

    lines.forEach(line => {
      if (layout.y + height > layout.bottom) {
        doc.addPage();
        startPage(layout, false);
      }
      doc.text(line, x, layout.y);
      layout.y += height;
    });
  }

  /* The amber notice box under the headline. */
  function drawNoticeBox(layout, text) {
    const doc = layout.doc;
    const size = 8.5;
    const lines = wrapText(doc, text, layout.width - 9, size, "normal");
    const height = lines.length * lineHeight(layout, size) + 7;

    ensureSpace(layout, height + 4);
    doc.setFillColor(COLORS.noticeFill[0], COLORS.noticeFill[1], COLORS.noticeFill[2]);
    doc.setDrawColor(COLORS.noticeLine[0], COLORS.noticeLine[1], COLORS.noticeLine[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(layout.left, layout.y, layout.width, height, 2, 2, "FD");
    doc.setTextColor(COLORS.noticeText[0], COLORS.noticeText[1], COLORS.noticeText[2]);
    lines.forEach((line, index) => {
      doc.text(line, layout.left + 4.5, layout.y + 5.2 + index * lineHeight(layout, size));
    });
    layout.y += height + 8;
  }

  /* The small line that records when and how the document was made. */
  function drawMeta(layout, filledCount, fieldCount, sectionCount) {
    const doc = layout.doc;
    const size = 8;
    const text = "Generated on " + formatTimestamp(new Date())
      + "   ┬╖   " + filledCount + " of " + fieldCount + (fieldCount === 1 ? " answer" : " answers") + " provided"
      + "   ┬╖   " + sectionCount + (sectionCount === 1 ? " section" : " sections")
      + "   ┬╖   Created on this device";
    const lines = wrapText(doc, text, layout.width, size, "normal");
    drawLines(layout, lines, { size: size, style: "normal", color: COLORS.muted });
    layout.y += 4;
  }

  /* A section heading with a rule underneath it. */
  function drawSectionHeading(layout, section) {
    const doc = layout.doc;
    ensureSpace(layout, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(COLORS.teal[0], COLORS.teal[1], COLORS.teal[2]);
    doc.text(String(section.step) + ".  " + String(section.title || "").toUpperCase(), layout.left, layout.y);
    layout.y += 2.5;
    doc.setDrawColor(COLORS.teal[0], COLORS.teal[1], COLORS.teal[2]);
    doc.setLineWidth(0.4);
    doc.line(layout.left, layout.y, layout.right, layout.y);
    layout.y += 7;
  }

  /* One answered field: a small label and the answer underneath it. */
  function drawField(layout, field) {
    const doc = layout.doc;
    const labelSize = 8;
    const valueSize = 10.5;

    const labelLines = wrapText(doc, field.label.toUpperCase(), layout.width, labelSize, "bold");
    const valueStyle = field.hasValue ? "normal" : "italic";
    const valueColor = field.hasValue ? COLORS.ink : COLORS.muted;
    const valueLines = wrapText(doc, field.display, layout.width, valueSize, valueStyle);

    const blockHeight = labelLines.length * lineHeight(layout, labelSize)
      + 2
      + valueLines.length * lineHeight(layout, valueSize)
      + 6;

    /* A single very long answer may be taller than a whole page. In that case
     * the label is drawn first and the answer flows over the pages. The label
     * is never left alone at the bottom of a page: it always keeps at least a
     * few lines of its answer with it. */
    if (blockHeight > layout.bottom - PAGE.continuationTop) {
      const keepWithAnswer = labelLines.length * lineHeight(layout, labelSize)
        + 2
        + Math.min(3, valueLines.length) * lineHeight(layout, valueSize);
      ensureSpace(layout, keepWithAnswer);
      drawLines(layout, labelLines, { size: labelSize, style: "bold", color: COLORS.muted });
      layout.y += 2;
      drawLines(layout, valueLines, { size: valueSize, style: valueStyle, color: valueColor });
      layout.y += 6;
      return;
    }

    ensureSpace(layout, blockHeight);
    drawLines(layout, labelLines, { size: labelSize, style: "bold", color: COLORS.muted });
    layout.y += 2;
    drawLines(layout, valueLines, { size: valueSize, style: valueStyle, color: valueColor });
    layout.y += 6;
  }

  /* The footer of every page: the reminder and the page number. */
  function drawFooters(layout) {
    const doc = layout.doc;
    const total = doc.getNumberOfPages();
    const ruleY = layout.pageHeight - 14;
    const textY = layout.pageHeight - 8.5;

    for (let page = 1; page <= total; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
      doc.setLineWidth(0.2);
      doc.line(layout.left, ruleY, layout.right, ruleY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.text(FOOTER, layout.left, textY);
      doc.text("Page " + page + " of " + total, layout.right, textY, { align: "right" });
    }
  }

  /* ------------------------------------------------------------- documents */

  /* The sections of the application, taken from the shared review structure
   * so the PDF and the review screen always show the same fields. */
  function resolveSections(answers) {
    return window.VagmitraValidation.getReviewStructure(answers);
  }

  /* Builds the PDF document.
   *
   * Returns the jsPDF document, the sections that were written, the number of
   * answers that were included and a warning when something had to be left
   * out of the document. */
  function buildDocument(answers) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("The PDF library could not be loaded. Please check your internet connection and try again.");
    }
    if (!window.VagmitraValidation || typeof window.VagmitraValidation.validateAll !== "function") {
      throw new Error("The validation module could not be loaded. Please reload the page and try again.");
    }

    const data = answers && typeof answers === "object" ? answers : {};
    const sections = resolveSections(data);
    const fieldCount = sections.reduce((total, section) => total + section.fields.length, 0);
    const filledCount = sections.reduce(
      (total, section) => total + section.fields.filter(field => field.hasValue).length,
      0
    );

    /* Nothing to put in the document: the caller gets a readable message
     * instead of an empty file. */
    if (fieldCount === 0 || filledCount === 0) {
      throw new Error("There is nothing to include yet. Please complete the form before generating your application.");
    }

    /* The document is only written when every mandatory answer passes
     * validation. The check lives here, and not only in the interface, so
     * that no caller - the review screen, a test or a later feature - can
     * produce an application from incomplete or wrong answers. */
    const check = window.VagmitraValidation.validateAll(data);
    if (!check.valid) {
      const labels = check.issues.map(issue => issue.label);
      throw new Error(
        "The application cannot be generated yet. Please correct " + check.issues.length +
        (check.issues.length === 1 ? " answer: " : " answers: ") + labels.join(", ") + "."
      );
    }

    const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    const layout = createLayout(doc);

    /* Document properties. They describe the prototype only and never contain
     * anything about the person who filled in the form. */
    doc.setProperties({
      title: TITLE,
      subject: "Prototype intake summary generated by Vagmitra",
      author: "Vagmitra prototype",
      creator: "Vagmitra",
      keywords: "vagmitra,intake,prototype"
    });

    startPage(layout, true);
    drawNoticeBox(layout, NOTICE);
    drawMeta(layout, filledCount, fieldCount, sections.length);

    const affectedFields = [];
    let writtenFields = 0;

    sections.forEach(section => {
      drawSectionHeading(layout, section);
      section.fields.forEach(field => {
        const label = sanitizeText(field.label);
        const value = sanitizeText(field.hasValue ? field.value : "Not provided");
        if (label.removed || value.removed) affectedFields.push(field.label);
        writtenFields += 1;
        drawField(layout, {
          label: label.text,
          value: value.text,
          display: value.text,
          hasValue: field.hasValue
        });
      });
    });

    drawFooters(layout);

    let warning = "";
    if (affectedFields.length) {
      const names = affectedFields.filter((name, index) => affectedFields.indexOf(name) === index);
      warning = "Some characters in " + names.join(", ") + " cannot be shown in the PDF because the PDF font does not support them. Please check those answers in the review list.";
    }

    return {
      doc: doc,
      sections: sections,
      fieldCount: writtenFields,
      filledCount: filledCount,
      warning: warning
    };
  }

  /* Hands the generated document to the browser as a download. The temporary
   * blob URL is released again once the download has started. */
  function saveDocument(doc, fileName) {
    if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.rel = "noopener";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => {
        if (window.VagmitraPrivacy) {
          window.VagmitraPrivacy.releaseObjectUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      }, 10000);
      return;
    }
    /* Fallback for browsers without blob URL support. */
    if (typeof doc.save === "function") {
      doc.save(fileName);
      return;
    }
    throw new Error("This browser cannot save the generated file. Please try another browser.");
  }

  window.VagmitraPdf = {
    /* Downloads the application as Vagmitra_Application.pdf.
     *
     * The answers are validated first: an application is only written when
     * every mandatory answer passes. Throws an error with a readable message
     * when the answers are incomplete or wrong, or when the document could
     * not be created at all.
     *
     * Returns { ok: true, warning, fileName, fieldCount }. A warning is only
     * about characters the PDF font could not show - the document is valid
     * either way. */
    download(answers) {
      const built = buildDocument(answers);
      saveDocument(built.doc, FILE_NAME);
      return { ok: true, warning: built.warning, fileName: FILE_NAME, fieldCount: built.fieldCount };
    },

    /* Returns the jsPDF document without saving it, for a preview or a test.
     * The answers are validated here as well, so build() refuses incomplete
     * or wrong answers in the same way download() does. */
    build(answers) {
      return buildDocument(answers);
    },

    fileName: FILE_NAME,
    title: TITLE
  };
})();
