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
  let pdfGenerated = false;
  let reviewJump = false;
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
  function saveAndContinue() {
    const q = dialogue.current(), input = document.getElementById("answer-input");
    let value = input.value;
    if(q.id==="phone") value=window.VagmitraNormalize.phone(value);
    if(q.id==="email") value=window.VagmitraNormalize.email(value);
    if(q.id==="fullName"||q.id==="address") value=window.VagmitraNormalize.whitespace(value);
    const error=window.VagmitraValidation.validate(q,value);
    document.getElementById("field-error").textContent=error;
    if(error){input.focus();return;}
    dialogue.save(value); dialogue.next();
    /* When the user was sent here from the review screen to correct an
       answer, the corrected value goes straight back to the review screen. */
    if(reviewJump){reviewJump=false;renderReview();return;}
    renderQuestion();
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
    content.innerHTML=header("STEP 5 · DOCUMENTS","Do you have a supporting document?","This step is optional. You can upload a PDF for local text extraction, or skip it and continue.")+
      `<div class="upload-box"><div style="font-size:27px">📄</div><b style="font-size:13px">Upload a PDF document</b><p class="step-description" style="margin:7px 0 14px">Choose a file from your device. It is processed in this browser only.</p><input type="file" id="document-input" accept="application/pdf"><div id="file-status" class="file-list"></div></div>
      <div class="notice">Do not upload sensitive documents to this public prototype. The project currently has no DigiLocker connection. Only use sample or test documents.</div>
      <div class="action-row"><button class="btn btn-primary" id="review-btn">Continue to review →</button><button class="btn btn-secondary" id="skip-btn">Skip this step</button><button class="btn btn-secondary" id="back-btn">← Back</button></div>`;
    document.getElementById("document-input").onchange=async e=>{
      uploadedFile=e.target.files[0]; const out=document.getElementById("file-status");
      if(!uploadedFile)return;
      out.textContent=`Selected: ${uploadedFile.name}. Extracting text…`;
      try { const text=await window.VagmitraDocument.extractPdf(uploadedFile); dialogue.answers.documentName=uploadedFile.name; dialogue.answers.documentTextExtracted=text?"Yes":"No readable text found"; out.textContent=`${uploadedFile.name} — ${text.length} characters extracted. No data was uploaded.`; }
      catch(err){out.textContent=err.message;uploadedFile=null;}
    };
    document.getElementById("review-btn").onclick=renderReview;
    document.getElementById("skip-btn").onclick=renderReview;
    document.getElementById("back-btn").onclick=()=>{dialogue.index=questions.length-1;renderQuestion();};
  }
  /* The review screen reuses the shared review structure from js/validation.js,
     so the table on screen and the generated PDF always show exactly the same
     fields, in the same order, with the same validation state. */
  function renderReview() {
    dialogue.index=questions.length+1; reviewJump=false; updateProgress();
    const result=window.VagmitraValidation.validateAll(dialogue.answers,questions);
    const rows=result.sections.map(section=>
      `<tr><td colspan="2"><b>${esc(section.step)}. ${esc(String(section.title||"").toUpperCase())}</b></td></tr>`+
      section.fields.map(field=>`<tr><td>${esc(field.label)}${field.required||/optional/i.test(field.label)?"":"<br><small>(optional)</small>"}</td><td>${esc(field.display)}${field.valid?"":"<br><small>"+esc(field.message)+"</small>"}</td></tr>`).join("")
    ).join("");
    const issues=result.issues.map(issue=>`<li><button type="button" data-goto="${esc(issue.id)}" style="border:0;background:none;color:var(--teal);font:600 11px 'DM Sans';cursor:pointer;padding:0;text-decoration:underline">${esc(issue.label)}</button> — ${esc(issue.message)}</li>`).join("");
    content.innerHTML=header("STEP 6 · REVIEW","Let’s check your answers","Please review every detail. You can go back and make changes before downloading your summary.")+
      `<table class="review-table">${rows||"<tr><td>No answers yet</td></tr>"}</table>
      ${issues?`<div class="notice" id="review-issues"><b>${esc(result.summary)}</b><ul>${issues}</ul></div>`:""}
      <div class="notice" id="pdf-note" hidden></div>
      <div class="notice">This is a prototype summary, not an official application or submission. Verify details and submit them only through the relevant official portal.</div>
      <div class="action-row"><button class="btn btn-primary" id="download-btn"${result.valid?"":" disabled"}>⬇ Download PDF summary</button><button class="btn btn-secondary" id="edit-btn">← Edit answers</button><button class="btn btn-secondary" id="finish-btn">Finish & clear data</button></div>`;
    /* Jump straight to the field that needs attention. */
    [...content.querySelectorAll("[data-goto]")].forEach(button=>{
      button.onclick=()=>{
        const id=button.getAttribute("data-goto");
        const index=questions.findIndex(q=>q.id===id);
        if(id==="documentName"||id==="documentTextExtracted"){reviewJump=true;dialogue.index=questions.length;renderQuestion();return;}
        if(index===-1)return;
        reviewJump=true;dialogue.index=index;renderQuestion();
      };
    });
    /* The application is only generated when every answer passes validation. */
    document.getElementById("download-btn").onclick=()=>{
      const check=window.VagmitraValidation.validateAll(dialogue.answers,questions);
      if(!check.valid){renderReview();showPdfNote(check.summary+" Please use the list above to correct them.");return;}
      try{
        const outcome=window.VagmitraPdf.download(dialogue.answers);
        pdfGenerated=true;
        showPdfNote(outcome&&outcome.warning?outcome.warning:"Your application has been generated and saved to this device as "+window.VagmitraPdf.fileName+".");
      }catch(e){showPdfNote(e&&e.message?e.message:"The application could not be generated. Please try again.");}
    };
    document.getElementById("edit-btn").onclick=()=>{reviewJump=false;dialogue.index=0;renderQuestion();};
    document.getElementById("finish-btn").onclick=()=>{if(confirm(clearConfirmation())){clearSessionData();status.textContent="Session data cleared.";renderQuestion();}};
  }
  /* Shows a message about the generated document in the review screen. */
  function showPdfNote(text){
    const note=document.getElementById("pdf-note");
    if(note){note.textContent=text;note.hidden=false;}
    status.textContent=text;
  }
  /* Khushi: removes every answer and the uploaded file from memory. Nothing
     is cleared before the user has had the chance to download the
     application - the confirmation asks for it. */
  function clearSessionData(){
    window.VagmitraPrivacy.clearSession(dialogue);
    uploadedFile=null;
    pdfGenerated=false;
    reviewJump=false;
  }
  function clearConfirmation(){
    return pdfGenerated
      ? "Your application PDF has been generated. Clear all answers from this session?"
      : "Clear all answers from this session? Download your application PDF first if you want to keep a copy of it.";
  }
  function restart(){if(confirm(clearConfirmation())){clearSessionData();status.textContent="A new session has started.";renderQuestion();}}
  document.getElementById("restart-btn").onclick=restart;
  renderQuestion();
})();
