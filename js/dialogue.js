/* Katyayani: Dialogue Management Module */

window.VagmitraDialogue = class {

  constructor(questions) {
    this.questions = questions;
    this.index = 0;
    this.answers = {};

    // Dialogue State Machine
    this.STATES = {
      ASKING: "asking",
      LISTENING: "listening",
      CONFIRMING: "confirming",
      COMPLETED: "completed"
    };

    this.state = this.STATES.ASKING;
  }

  current() {
    return this.questions[this.index] || null;
  }

  save(value) {
    const q = this.current();

    if (q) {
      this.answers[q.id] = value;
      this.state = this.STATES.CONFIRMING;
    }
  }

  next() {

    if (this.index < this.questions.length) {
      this.index++;
    }

    if (this.index >= this.questions.length) {
      this.state = this.STATES.COMPLETED;
    } else {
      this.state = this.STATES.ASKING;
    }

    return this.current();
  }

  previous() {

    if (this.index > 0) {
      this.index--;
    }

    this.state = this.STATES.ASKING;

    return this.current();
  }

  repeatQuestion() {
    const q = this.current();
    return q ? q.prompt : "";
  }

  editAnswer(value) {
    const q = this.current();

    if (q) {
      this.answers[q.id] = value;
      this.state = this.STATES.ASKING;
    }
  }

  getAnswer(questionId) {
    return this.answers[questionId] || "";
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

  reset() {
    this.index = 0;
    this.answers = {};
    this.state = this.STATES.ASKING;
  }

  get progress() {
    return this.index / (this.questions.length + 1);
  }
};