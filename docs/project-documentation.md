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
- Normalization: `window.VagmitraNormalize`.
- Documents: `window.VagmitraDocument.extractPdf(file)` returns extracted text.
- PDF: `window.VagmitraPdf.download(answers)` downloads the review summary.

## Suggested next development tasks
1. Agree on supported languages and add a language selector.
2. Improve voice correction, repeat and confirmation flows.
3. Add field-specific document extraction with user confirmation.
4. Add accessibility testing with keyboard-only navigation and screen readers.
5. Add unit tests and integration tests.
6. Only add backend/API integrations after agreeing on privacy, consent and security requirements.
