# Vagmitra – Assistive Voice-Driven Intake System for Public Digital Portals

**Problem Code:** 402  
**Status:** Initial integrated frontend prototype

## Overview
Vagmitra is a voice-assisted, one-question-at-a-time intake interface designed to make public digital portal forms easier to complete. Users can type or speak answers, optionally upload a sample PDF for local text extraction, review their responses and download a PDF summary.

## Current prototype features
- Responsive welcome and intake interface
- One-question-at-a-time flow
- Browser speech recognition and text-to-speech (where supported)
- Basic client-side validation and normalization
- Optional local PDF text extraction using PDF.js
- Review screen and PDF summary download using jsPDF
- Session-only in-memory answers; no backend or server submission

## Team ownership
| Team member | Responsibility | Files |
|---|---|---|
| Kavya | Frontend development & UI | `index.html`, `css/styles.css`, `js/app.js` |
| Rajkanya | Speech-to-text / text-to-speech | `js/speech.js` |
| H. S. Katyayani | Dialogue management | `js/dialogue.js`, `js/questions.js` |
| Kajal Yadav | Document assistance & normalization | `js/document.js`, `js/normalization.js` |
| Khushi | Validation, privacy & PDF generation | `js/validation.js`, `js/pdf-generator.js` |

## Run locally
1. Download or clone this repository.
2. Open the folder in VS Code.
3. Start `index.html` using the VS Code Live Server extension (recommended), or use another local static web server.
4. Internet access is needed to load the CDN libraries and Google Fonts. Microphone access requires browser permission and generally works on `localhost` or HTTPS.
5. Try the flow with sample information only.

## Project structure
```text
index.html
css/styles.css
js/
  app.js
  speech.js
  dialogue.js
  questions.js
  document.js
  normalization.js
  validation.js
  pdf-generator.js
assets/
  images/
  icons/
docs/
```

## Collaboration workflow
- Do not commit directly to `main` for feature work.
- Create one branch per person:
  - `feature/frontend-ui`
  - `feature/speech-module`
  - `feature/dialogue-module`
  - `feature/document-module`
  - `feature/validation-pdf`
- Commit focused changes and open a Pull Request to `main`.
- Coordinate shared function names and interfaces before changing integration points.
- Pull the latest `main` before starting work.

## Important limitations and privacy
- This is a frontend prototype. It does not connect to a government portal or submit applications.
- DigiLocker integration is not implemented; documents are manually selected by the user.
- PDF extraction works only for text-based PDFs; scanned PDFs need OCR, which is not included.
- Browser speech recognition varies by browser, language and device.
- Do not upload real identity documents, personal records, API keys, passwords or citizen data to this public repository or demo.
- Do not treat the generated PDF as an official government document.
