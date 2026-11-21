/* Rajkanya: browser speech recognition and text-to-speech. Requires browser support and microphone permission. */
window.VagmitraSpeech = (() => {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;

  let recognition = null;
  let isListening = false;
  let lastSpokenText = "";
  let preferredVoice = null;
  let currentLang = "en-IN";

  // Select an Indian English voice when available
  function initVoices() {
    if (!synth) return;
    const loadVoices = () => {
      const voices = synth.getVoices();
      preferredVoice =
        voices.find((v) => v.lang === currentLang) ||
        voices.find((v) => v.lang === "en-IN") ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0] ||
        null;
    };
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }
  initVoices();

  function supported() {
    return Boolean(Recognition && synth);
  }

  function setLanguage(langCode) {
    currentLang = langCode || "en-IN";
    initVoices();
  }

  /**
   * Convert spoken dates like "15 August 2005" or "15/08/2005" into "2005-08-15"
   * so HTML <input type="date"> accepts voice input cleanly.
   */
  function tryFormatSpokenDate(text) {
    const months = {
      january: "01", jan: "01",
      february: "02", feb: "02",
      march: "03", mar: "03",
      april: "04", apr: "04",
      may: "05",
      june: "06", jun: "06",
      july: "07", jul: "07",
      august: "08", aug: "08",
      september: "09", sep: "09", sept: "09",
      october: "10", oct: "10",
      november: "11", nov: "11",
      december: "12", dec: "12"
    };

    // Match "15 August 2005" or "15th August 2005"
    const wordMatch = text.toLowerCase().match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+),?\s+(\d{4})$/);
    if (wordMatch && months[wordMatch[2]]) {
      const day = wordMatch[1].padStart(2, "0");
      return `${wordMatch[3]}-${months[wordMatch[2]]}-${day}`;
    }

    // Match "15/08/2005" or "15-08-2005" (DD/MM/YYYY)
    const slashMatch = text.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (slashMatch) {
      const day = slashMatch[1].padStart(2, "0");
      const month = slashMatch[2].padStart(2, "0");
      if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
        return `${slashMatch[3]}-${month}-${day}`;
      }
    }
    return null;
  }

  /**
   * Normalize spoken emails, dates, and trailing punctuation before passing to app.js
   */
  function cleanSpokenTranscript(rawText) {
    let text = String(rawText || "").trim().replace(/\.$/, "");

    // Convert spoken email patterns ("rajkanya at gmail dot com" -> "rajkanya@gmail.com")
    if (/\s+at\s+/i.test(text) && /\s+dot\s+/i.test(text)) {
      return text
        .toLowerCase()
        .replace(/\s+at\s+/g, "@")
        .replace(/\s+dot\s+/g, ".")
        .replace(/\s+underscore\s+/g, "_")
        .replace(/\s+dash\s+/g, "-")
        .replace(/\s+hyphen\s+/g, "-")
        .replace(/\s+/g, "");
    }

    // Convert spoken dates into YYYY-MM-DD if applicable
    const formattedDate = tryFormatSpokenDate(text);
    if (formattedDate) return formattedDate;

    return text;
  }

  function mapError(errorCode) {
    switch (errorCode) {
      case "not-allowed":
      case "service-not-allowed":
        return "Microphone permission was blocked. Allow it in your browser settings.";
      case "no-speech":
        return "No speech detected. Please click Speak answer and try again.";
      case "audio-capture":
        return "No microphone detected. Check your headset/mic or type your answer.";
      case "network":
        return "Network error during voice recognition. Check your internet connection.";
      case "aborted":
        return "Listening stopped.";
      default:
        return "Could not understand that. Please try again or type your answer.";
    }
  }

  function stop() {
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      isListening = false;
    }
  }

  function stopAll() {
    stop();
    if (synth) {
      synth.cancel();
    }
  }

  function speak(text, onEnd, onError) {
    if (!synth) {
      if (onError) onError("Text-to-speech is not supported in this browser.");
      return;
    }

    // Echo prevention: stop active mic before speaking
    stop();
    synth.cancel();

    lastSpokenText = text;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      if (event.error !== "interrupted" && event.error !== "canceled") {
        if (onError) onError("Could not read question aloud.");
      }
    };

    synth.speak(utterance);
  }

  function repeatLast(onEnd, onError) {
    if (lastSpokenText) {
      speak(lastSpokenText, onEnd, onError);
    }
  }

  function listen(onResult, onError, onEnd) {
    if (!Recognition) {
      if (onError) onError("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    // Echo prevention: cancel TTS before opening microphone
    if (synth) {
      synth.cancel();
    }
    stop();

    try {
      recognition = new Recognition();
      recognition.lang = currentLang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListening = true;
      };

      recognition.onresult = (e) => {
        const rawTranscript = e.results[0][0].transcript;
        const cleanedTranscript = cleanSpokenTranscript(rawTranscript);
        if (onResult) onResult(cleanedTranscript);
      };

      recognition.onerror = (e) => {
        isListening = false;
        if (onError) onError(mapError(e.error));
      };

      recognition.onend = () => {
        isListening = false;
        if (onEnd) onEnd();
      };

      recognition.start();
    } catch (err) {
      isListening = false;
      if (onError) onError("Voice input could not start. Please try again.");
    }
  }

  /**
   * Spoken confirmation loop:
   * Application: "Your name is Kavya Moodi. Is that correct?"
   */
  function confirmAnswer(fieldLabel, recognizedValue, { onConfirmed, onRejected, onUnclear, onError } = {}) {
    const prompt = `Your ${fieldLabel} is ${recognizedValue}. Is that correct?`;

    speak(
      prompt,
      () => {
        listen(
          (transcript) => {
            const words = transcript.toLowerCase().replace(/[.,!?]/g, "").trim().split(/\s+/);
            const yesWords = ["yes", "yeah", "yep", "correct", "right", "confirm", "ok", "okay", "haan", "ho"];
            const noWords = ["no", "nope", "wrong", "incorrect", "edit", "change", "nahi"];

            if (yesWords.some((w) => words.includes(w))) {
              if (onConfirmed) onConfirmed(recognizedValue);
            } else if (noWords.some((w) => words.includes(w))) {
              if (onRejected) onRejected();
            } else {
              if (onUnclear) onUnclear(transcript);
            }
          },
          onError
        );
      },
      onError
    );
  }

  return {
    supported,
    setLanguage,
    listen,
    stop,
    stopAll,
    speak,
    repeatLast,
    confirmAnswer
  };
})();