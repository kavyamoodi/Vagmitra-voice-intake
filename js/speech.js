/* Rajkanya: browser speech recognition and text-to-speech. Requires browser support and microphone permission. */
window.VagmitraSpeech = (() => {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  function supported() { return !!Recognition; }
  function listen(onResult, onError, onEnd) {
    if (!supported()) { onError("Voice input is not supported in this browser. Try Chrome or Edge."); return; }
    try {
      recognition = new Recognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = e => onResult(e.results[0][0].transcript);
      recognition.onerror = e => onError(e.error === "not-allowed" ? "Microphone permission was blocked. Allow it in your browser settings." : "Could not understand that. Please try again or type your answer.");
      recognition.onend = () => { if (onEnd) onEnd(); };
      recognition.start();
    } catch (err) { onError("Voice input could not start. Please try again."); }
  }
  function stop() { if (recognition) recognition.stop(); }
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
  }
  return { supported, listen, stop, speak };
})();
