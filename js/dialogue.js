/* Katyayani: simple one-question-at-a-time dialogue controller. */
window.VagmitraDialogue = class {
  constructor(questions) { this.questions = questions; this.index = 0; this.answers = {}; }
  current() { return this.questions[this.index] || null; }
  save(value) { const q = this.current(); if (q) this.answers[q.id] = value; }
  next() { if (this.index < this.questions.length) this.index++; return this.current(); }
  previous() { if (this.index > 0) this.index--; return this.current(); }
  reset() { this.index = 0; this.answers = {}; }
  get progress() { return this.index / (this.questions.length + 1); }
};
