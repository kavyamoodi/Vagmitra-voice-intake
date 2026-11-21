# Project documentation

## Purpose
Provide an accessible, voice-assisted interface that guides a person through a public-portal intake flow one question at a time.

## Prototype flow
Welcome → Personal details → Contact details → Address → Application details → Optional document upload → Review → PDF summary.

## Integration contracts
- Questions: `window.VAGMITRA_QUESTIONS` (array of question objects with stable `id` values).
- Dialogue: `new window.VagmitraDialogue(questions)` exposes `current()`, `save(value)`, `next()`, `previous()`, `reset()`, `answers`, and `index`.
- Speech: `window.VagmitraSpeech.listen(onResult, onError, onEnd)`, `speak(text)`, `stop()`, `supported()`.
- Validation: `window.VagmitraValidation.validate(question, value)` returns an error string or an empty string.
  - `window.VagmitraValidation.validateAll(answers, questions)` returns `{ valid, complete, issues, missing, invalid, sections, summary }`. `issues` lists every field that still needs attention as `{ id, label, step, message, missing }`, so the review screen can name the exact field to correct.
  - `window.VagmitraValidation.getReviewStructure(answers, questions)` returns the grouped sections (`{ step, title, fields[] }`) used by both the review screen and the PDF, so the two always show the same fields in the same order. Each field carries `{ id, label, step, title, required, value, display, hasValue, missing, valid, message }`.
  - `window.VagmitraValidation.getFieldDefinitions(questions)` returns the label, step, title, type and required flag of every question.
  - `window.VagmitraValidation.getIssue(result, id)` returns the issue of one field, or `null`.
- Normalization: `window.VagmitraNormalize`.
- Documents: `window.VagmitraDocument.extractPdf(file)` returns extracted text.
- PDF: `window.VagmitraPdf.download(answers)` downloads the review summary as `Vagmitra_Application.pdf` and returns `{ ok, warning, fileName, fieldCount }`. It throws a readable error when the document cannot be written. `window.VagmitraPdf.build(answers)` returns the same document without saving it, for a preview or a test.
- Privacy: `window.VagmitraPrivacy.clearSession(dialogue)` empties the answers held in memory, `window.VagmitraPrivacy.releaseObjectUrl(url)` releases a temporary download URL, `window.VagmitraPrivacy.describeSession(dialogue)` reports only how many answers are held, and `window.VagmitraPrivacy.scrubText(value)` removes control characters. Nothing is transmitted to a server and nothing is written to storage.

## Suggested next development tasks
1. Agree on supported languages and add a language selector.
2. Improve voice correction, repeat and confirmation flows.
3. Add field-specific document extraction with user confirmation.
4. Add accessibility testing with keyboard-only navigation and screen readers.
5. Add unit tests and integration tests.
6. Only add backend/API integrations after agreeing on privacy, consent and security requirements.
