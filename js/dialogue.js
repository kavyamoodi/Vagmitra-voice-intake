/* Katyayani: simple one-question-at-a-time dialogue controller. */

window.VagmitraDialogue = class {

  constructor(questions) {
    this.questions = questions;
    this.index = 0;
    this.answers = {};

    // Dialogue state machine
    this.state = "asking";
  }

  current() {
    return this.questions[this.index] || null;
  }

  save(value) {
    const q = this.current();

    if (q) {
      this.answers[q.id] = value;
      this.state = "confirming";
    }
  }

  next() {

    if (this.index < this.questions.length) {
      this.index++;
    }

    this.state = "asking";

    return this.current();
  }

  previous() {

    if (this.index > 0) {
      this.index--;
    }

    this.state = "asking";

    return this.current();
  }

  reset() {
    this.index = 0;
    this.answers = {};
    this.state = "asking";
  }

  repeatQuestion() {
    const q = this.current();
    return q ? q.prompt : "";
  }

  editAnswer(value) {
    const q = this.current();

    if (q) {
      this.answers[q.id] = value;
    }
  }

  getAnswer(id) {
    return this.answers[id] || "";
  }

  getAllAnswers() {
    return this.answers;
  }

  getState() {
    return this.state;
  }

  setState(state) {
    this.state = state;
  }

  get progress() {
    return this.index / (this.questions.length + 1);
  }

};