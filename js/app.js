/* Kavya: UI, navigation, accessibility and integration of team modules. */
(() => {
  const questions = window.VAGMITRA_QUESTIONS;
  const dialogue = new window.VagmitraDialogue(questions);
  const content = document.getElementById("step-content");
  const status = document.getElementById("status-message");
  const progressFill = document.getElementById("progress-fill");
  const progressCount = document.getElementById("progress-count");
  const stepList = document.getElementById("step-list");
  let uploadedFile = null;
  let confirmationHandled = false;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const stepTitles = ["Personal details","Contact details","Address","Application","Documents","Review"];

  function updateProgress() {
    const index = dialogue.index;
    const total = 6;
    const completed = Math.min(index, total);
    progressFill.style.width = `${completed / total * 100}%`;
    progressCount.textContent = `${completed} / ${total}`;
    [...stepList.children].forEach((li, i) => {
      li.classList.toggle("active", i === Math.min(Math.floor(index === questions.length ? 4 : index / questions.length * 4), 5));
      li.classList.toggle("done", i < Math.min(index, 4));
    });
  }
  function header(kicker, title, description) {
    return `<div class="kicker">${kicker}</div><h2>${title}</h2><p class="step-description">${description}</p>`;
  }
  function renderQuestion() {
    updateProgress();
    const q = dialogue.current();
    if (!q) return renderDocuments();
    const currentValue = dialogue.answers[q.id] || "";
    let field = "";
    if (q.type === "textarea") field = `<textarea class="field" id="answer-input" rows="3" placeholder="${esc(q.placeholder)}">${esc(currentValue)}</textarea>`;
    else if (q.type === "select") field = `<select class="field" id="answer-input"><option value="">${esc(q.placeholder)}</option>${q.options.map(o=>`<option ${currentValue===o?"selected":""}>${esc(o)}</option>`).join("")}</select>`;
    else field = `<input class="field" id="answer-input" type="${q.type}" value="${esc(currentValue)}" placeholder="${esc(q.placeholder||"")}" ${q.autocomplete?`autocomplete="${q.autocomplete}"`:""}>`;
    content.innerHTML = header(`STEP ${q.step} · ${esc(q.title.toUpperCase())}`, q.prompt, "You can type your answer or use the microphone. You can review your answers before finishing.") +
      `<div class="question-card"><label for="answer-input">${esc(q.label)} ${q.required?'<span style="color:#b54747">*</span>':""}</label>${field}<div class="field-error" id="field-error"></div><div class="field-hint">${q.required?"Required field":"Optional field"}</div></div>
      <div class="action-row"><button class="btn btn-primary" id="continue-btn">Continue →</button><button class="btn btn-voice" id="voice-btn">🎙 Speak answer</button><button class="btn btn-secondary" id="read-btn">🔊 Read question</button>${dialogue.index>0?'<button class="btn btn-secondary" id="back-btn">← Back</button>':""}</div><div class="voice-state" id="voice-state"></div>`;
    document.getElementById("continue-btn").onclick = saveAndContinue;
    document.getElementById("voice-btn").onclick = startVoice;
    document.getElementById("read-btn").onclick = () => window.VagmitraSpeech.speak(q.prompt);
    const back = document.getElementById("back-btn"); if(back) back.onclick=()=>{dialogue.previous();renderQuestion();};
    document.getElementById("answer-input").focus();
  }
  
  function showConfirmation(q, value) {
    dialogue.save(value);
    confirmationHandled = false;

    content.innerHTML = header(
      "CONFIRM YOUR ANSWER",
      "Is this correct?",
      "Please check the answer before moving to the next question."
    ) +
      `<div class="question-card">
        <label>${esc(q.label)}</label>
        <p>${esc(value || "Not provided")}</p>
      </div>
      <div class="action-row">
        <button class="btn btn-primary" id="confirm-answer-btn">Confirm</button>
        <button class="btn btn-secondary" id="edit-answer-btn">Edit answer</button>
      </div>
      <div class="voice-state" id="confirmation-status">
        You can say Yes or No, or use the buttons.
      </div>`;

    document.getElementById("confirm-answer-btn").onclick =
    () => finishConfirmation(value, true);

    document.getElementById("edit-answer-btn").onclick =
    () => finishConfirmation(value, false);

    window.VagmitraSpeech.confirmAnswer(q.label, value, {
      onConfirmed: () => finishConfirmation(value, true),
      onRejected: () => finishConfirmation(value, false),
      onUnclear: transcript => {
        if (!confirmationHandled) {
          document.getElementById("confirmation-status").textContent =
            `Heard: "${transcript}". Please say Yes or No, or use a button.`;
        }
      },
      onError: message => {
        if (!confirmationHandled) {
          document.getElementById("confirmation-status").textContent =
            `${message} You can use the buttons instead.`;
        }
      }
    });
  }

  function finishConfirmation(value, confirmed) {
    if (confirmationHandled) return;
    confirmationHandled = true;
      try {
    window.VagmitraSpeech?.stopAll?.();
  } catch (error) {
    console.warn("Could not stop speech:", error);
  }

    //window.VagmitraSpeech.stopAll();

   
    if (confirmed) {
      dialogue.next();
      renderQuestion();
    } else {
     // dialogue.editAnswer(value);
      renderQuestion();
    }
  }

  function saveAndContinue() {
    const q = dialogue.current();
    const input = document.getElementById("answer-input");
    let value = input.value;

    if (q.id === "phone") value = window.VagmitraNormalize.phone(value);
    if (q.id === "email") value = window.VagmitraNormalize.email(value);
    if (q.id === "fullName" || q.id === "address") {
      value = window.VagmitraNormalize.whitespace(value);
    }

    const error = window.VagmitraValidation.validate(q, value);
    document.getElementById("field-error").textContent = error;

    if (error) {
      input.focus();
      return;
    }

    showConfirmation(q, value);
  }

  function startVoice() {
    const q=dialogue.current(), voiceState=document.getElementById("voice-state");
    voiceState.textContent="Listening… Please speak clearly.";
    window.VagmitraSpeech.listen(transcript=>{
      const input=document.getElementById("answer-input");
      if(input.tagName==="SELECT"){
        const match=[...input.options].find(o=>o.text.toLowerCase()===transcript.toLowerCase());
        if(match) input.value=match.value; else voiceState.textContent=`Heard: “${transcript}”. Please select the closest option or type your answer.`;
      } else { input.value=transcript; voiceState.textContent=`Heard: “${transcript}”. Please check it before continuing.`; }
    }, message=>voiceState.textContent=message, ()=>{if(voiceState.textContent==="Listening… Please speak clearly.")voiceState.textContent="Listening stopped.";});
  }
  
function renderDocuments() {
  updateProgress();

  content.innerHTML =
    header(
      "STEP 5 · DOCUMENTS",
      "Do you have a supporting document?",
      "This step is optional. You can upload a PDF for local text extraction, or skip it and continue."
    ) +
    `<div class="upload-box">
      <div style="font-size:27px">📄</div>
      <b style="font-size:13px">Upload a PDF document</b>
      <p class="step-description" style="margin:7px 0 14px">
        Choose a file from your device. It is processed in this browser only.
      </p>
      <input type="file" id="document-input" accept="application/pdf">
      <div id="file-status" class="file-list"></div>
    </div>

    <div class="notice">
      Do not upload sensitive documents to this public prototype.
      The project currently has no DigiLocker connection.
      Only use sample or test documents.
    </div>

    <div class="action-row">
      <button class="btn btn-secondary" id="read-doc-instructions">
        🔊 Read instructions
      </button>
      <button class="btn btn-primary" id="review-btn">
        Continue to review →
      </button>
      <button class="btn btn-secondary" id="skip-btn">
        Skip this step
      </button>
      <button class="btn btn-secondary" id="back-btn">
        ← Back
      </button>
    </div>`;

  // Read document instructions aloud
  document.getElementById("read-doc-instructions").onclick = () => {
    window.VagmitraSpeech.speak(
      "Do you have a supporting document? You can upload a PDF document or skip this step. Please do not upload sensitive personal documents."
    );
  };

  // Process uploaded PDF
  document.getElementById("document-input").onchange = async e => {
    uploadedFile = e.target.files[0];
    const out = document.getElementById("file-status");

    if (!uploadedFile) return;

    out.textContent = "Extracting PDF text. Please wait...";

    try {
      const text = await window.VagmitraDocument.extractPdf(uploadedFile);

      dialogue.answers.documentName = uploadedFile.name;
      dialogue.answers.documentTextExtracted =
        text ? "Yes" : "No readable text found";

      if (text) {
        out.textContent =
          `${uploadedFile.name} — ${text.length} characters extracted. No data was uploaded.`;

        window.VagmitraSpeech.speak(
          "Your document was uploaded successfully. Its text has been read."
        );
      } else {
        out.textContent =
          "No readable text found in this PDF. Try another PDF.";

        window.VagmitraSpeech.speak(
          "The PDF was uploaded, but no readable text was found. Please try another PDF."
        );
      }

    } catch (err) {
      out.textContent = err.message;
      uploadedFile = null;

      window.VagmitraSpeech.speak(
        "Sorry, I could not read this PDF. Please try another PDF or skip this step."
      );
    }
  };

  document.getElementById("review-btn").onclick = renderReview;
  document.getElementById("skip-btn").onclick = renderReview;

  document.getElementById("back-btn").onclick = () => {
    dialogue.index = questions.length - 1;
    renderQuestion();
  };
}

  
function renderReview() {
  dialogue.index = questions.length + 1;
  updateProgress();

  const labels = {
    fullName: "Full name",
    dateOfBirth: "Date of birth",
    phone: "Mobile number",
    email: "Email address",
    address: "Address",
    applicationType: "Service or application",
    purpose: "Reason for application",
    documentName: "Uploaded file",
    documentTextExtracted: "PDF text extraction"
  };

  const rows = Object.entries(dialogue.answers)
    .filter(([k]) => k !== "documentTextExtracted")
    .map(([k, v]) =>
      `<tr><td>${esc(labels[k] || k)}</td><td>${esc(v || "Not provided")}</td></tr>`
    ).join("");

  content.innerHTML =
    header(
      "STEP 6 · REVIEW",
      "Let’s check your answers",
      "Please review every detail. You can go back and make changes before downloading your summary."
    ) +
    `<table class="review-table">${rows || "<tr><td>No answers yet</td></tr>"}</table>
    <div class="notice">This is a prototype summary, not an official application or submission. Verify details and submit them only through the relevant official portal.</div>
    <div class="action-row">
      <button class="btn btn-secondary" id="read-review-btn">🔊 Read answers aloud</button>
      <button class="btn btn-primary" id="download-btn">⬇ Download PDF summary</button>
      <button class="btn btn-secondary" id="edit-btn">← Edit answers</button>
      <button class="btn btn-secondary" id="finish-btn">Finish & clear data</button>
    </div>`;

  // Automatically announce the Review step
  window.VagmitraSpeech?.speak?.(
    "You have reached the review step. Please check your answers. You can listen to your answers, edit them, or download your PDF summary."
  );

  // Read all answers aloud when requested
  document.getElementById("read-review-btn").onclick = () => {
    const spokenReview = Object.entries(dialogue.answers)
      .filter(([k]) => k !== "documentTextExtracted")
      .map(([k, v]) =>
        `${labels[k] || k}: ${v || "Not provided"}`
      ).join(". ");

    window.VagmitraSpeech?.speak?.(
      "Here are your answers. " + spokenReview
    );
  };

  document.getElementById("download-btn").onclick = () => {
    try {
      window.VagmitraPdf.download(dialogue.answers);
      status.textContent = "Your PDF summary has been generated.";
    } catch (e) {
      status.textContent = e.message;
    }
  };

  document.getElementById("edit-btn").onclick = () => {
    dialogue.index = 0;
    renderQuestion();
  };

  document.getElementById("finish-btn").onclick = () => {
    if (confirm("Clear all answers from this session?")) {
      dialogue.reset();
      uploadedFile = null;
      status.textContent = "Session data cleared.";
      renderQuestion();
    }
  };
}
  

function renderQuestion() {
  updateProgress();
  const q = dialogue.current();
  if (!q) return renderDocuments();

  const currentValue = dialogue.answers[q.id] || "";
  let field = "";

  if (q.type === "textarea") {
    field = `<textarea class="field" id="answer-input" rows="3"
      placeholder="${esc(q.placeholder)}">${esc(currentValue)}</textarea>`;
  } else if (q.type === "select") {
    field = `<select class="field" id="answer-input">
      <option value="">${esc(q.placeholder)}</option>
      ${q.options.map(o => `<option ${currentValue === o ? "selected" : ""}>${esc(o)}</option>`).join("")}
    </select>`;
  } else {
    field = `<input class="field" id="answer-input" type="${q.type}"
      value="${esc(currentValue)}"
      placeholder="${esc(q.placeholder || "")}"
      ${q.autocomplete ? `autocomplete="${q.autocomplete}"` : ""}>`;
  }

  content.innerHTML =
    header(
      `STEP ${q.step} · ${esc(q.title.toUpperCase())}`,
      q.prompt,
      "You can type your answer or use the microphone. You can review your answers before finishing."
    ) +
    `<div class="question-card">
      <label for="answer-input">${esc(q.label)} ${q.required ? '<span style="color:#b54747">*</span>' : ""}</label>
      ${field}
      <div class="field-error" id="field-error"></div>
      <div class="field-hint">${q.required ? "Required field" : "Optional field"}</div>
    </div>
    <div class="action-row">
      <button class="btn btn-primary" id="continue-btn">Continue →</button>
      <button class="btn btn-voice" id="voice-btn">🎤 Speak answer</button>
      <button class="btn btn-secondary" id="read-btn">🔊 Read question</button>
      ${dialogue.index > 0 ? '<button class="btn btn-secondary" id="back-btn">← Back</button>' : ""}
    </div>
    <div class="voice-state" id="voice-state"></div>`;

  document.getElementById("continue-btn").onclick = saveAndContinue;
  document.getElementById("voice-btn").onclick = startVoice;
  document.getElementById("read-btn").onclick = () => window.VagmitraSpeech.speak(q.prompt);

  const back = document.getElementById("back-btn");
  if (back) back.onclick = () => {
    dialogue.previous();
    renderQuestion();
  };
  window.VagmitraSpeech.speak(q.prompt);
  document.getElementById("answer-input").focus();
  document.getElementById("answer-input").focus();
}

  function restart() {
  if (confirm("Start over and clear all entered answers?")) {
    dialogue.reset();
    uploadedFile = null;
    status.textContent = "A new session has started.";
    renderQuestion();
  }
}

document.getElementById("restart-btn").onclick = restart;
renderQuestion();
})();