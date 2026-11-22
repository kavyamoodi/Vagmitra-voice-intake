/* Khushi: data validation, review structure and privacy helpers for Vagmitra.
 *
 * Everything in this file runs in the browser only:
 *   - nothing is ever sent to a server,
 *   - answers are never written to the console, to storage or to any other
 *     permanent place,
 *   - validation messages describe the problem without repeating what the user
 *     typed, so personal data can never leak into an error message.
 */
(() => {
  "use strict";

  /* ------------------------------------------------------------- constants */

  const PHONE_PATTERN = /^\+?\d{10,13}$/;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  /* Finds "PIN 123456" / "pin code: 123456" / "zip 12345" inside free text. */
  const PIN_IN_TEXT = /\b(?:pin(?:\s*code)?|zip(?:\s*code)?)\b[:\-#\s]*(\d{4,10})/i;

  const MIN_AGE_YEARS = 0;
  const MAX_AGE_YEARS = 120;

  /* Rules for the questions that need more than a "not empty" check.
   * The keys match the `id` values in js/questions.js. */
  const FIELD_RULES = {
    fullName: {
      minLength: 2,
      minLengthMessage: "Please enter your full name using at least 2 characters.",
      mustContainLetter: true
    },
    address: {
      minLength: 10,
      minLengthMessage: "Please enter your complete address, including house number, area, city and PIN code."
    },
    purpose: {
      minLength: 10,
      minLengthMessage: "Please describe your request in a little more detail (at least 10 characters)."
    }
  };

  /* Rules that apply to every question of a given input type, so a question
   * added later is still checked without anyone having to edit this file. */
  const TYPE_RULES = {
    tel: { pattern: PHONE_PATTERN, message: "Enter a valid mobile number using 10 to 13 digits." },
    email: { pattern: EMAIL_PATTERN, message: "Enter a valid email address, for example name@example.com." },
    date: { kind: "date" }
  };

  /* Unicode aware letter check with a plain ASCII fallback for old browsers. */
  let LETTER_PATTERN = /[A-Za-z]/;
  try {
    LETTER_PATTERN = new RegExp("\\p{L}", "u");
  } catch (error) {
    /* the ASCII fallback stays in place */
  }

  /* ----------------------------------------------------------- small helpers */

  /* A value is "blank" when it is null, undefined, or only whitespace. */
  const isBlank = value => value === null || value === undefined || String(value).trim() === "";

  /* The answers object as a safe plain object. */
  const asAnswers = answers => (answers && typeof answers === "object" ? answers : {});

  /* The question list, defaulting to the shared definition in questions.js. */
  const asQuestions = questions => {
    if (Array.isArray(questions) && questions.length) return questions;
    return Array.isArray(window.VAGMITRA_QUESTIONS) ? window.VAGMITRA_QUESTIONS : [];
  };

  /* Today at midnight in the user's own time zone. Comparing local calendar
   * days (instead of absolute time points) avoids rejecting somebody's own
   * birthday because of a time zone offset. */
  const todayLocal = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  /* Parses "YYYY-MM-DD" into a local date, or null when the value is not a
   * real calendar date (for example "2026-02-30"). */
  function parseLocalDate(text) {
    if (!DATE_PATTERN.test(text)) return null;
    const parts = text.split("-").map(Number);
    let year = parts[0];
    if (year < 100) year += 1900;
    const date = new Date(year, parts[1] - 1, parts[2]);
    if (date.getFullYear() !== year || date.getMonth() !== parts[1] - 1 || date.getDate() !== parts[2]) return null;
    return date;
  }

  /* Whole years between a birth date and today. */
  function ageInYears(birthDate, today) {
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
    return age;
  }

  /* ------------------------------------------------------------- validation */

  /* Checks a date of birth: real calendar date, not in the future, plausible
   * age. Returns an error message or an empty string. */
  function validateDateOfBirth(text) {
    const birthDate = parseLocalDate(text);
    if (!birthDate) return "Enter the date of birth as day, month and year.";
    const today = todayLocal();
    if (birthDate.getTime() > today.getTime()) return "Date of birth cannot be in the future.";
    const age = ageInYears(birthDate, today);
    if (age > MAX_AGE_YEARS) return "Please check the year. That date looks more than " + MAX_AGE_YEARS + " years ago.";
    if (age < MIN_AGE_YEARS) return "Date of birth cannot be in the future.";
    return "";
  }

  /* If the address mentions a PIN or zip code it has to be a 6 digit number.
   * The address itself is free text, so nothing else is enforced here. */
  function validateAddressPin(text) {
    const match = PIN_IN_TEXT.exec(text);
    if (!match) return "";
    if (!/^\d{6}$/.test(match[1])) {
      return "Please enter the 6 digit PIN code, or leave the PIN out if you are not sure of it.";
    }
    return "";
  }

  /* Validates a single answer.
   *
   * The existing contract is kept: it returns an error message string, or an
   * empty string when the answer is acceptable. app.js uses that string for
   * the inline message under the field. */
  function validate(question, value) {
    if (!question || typeof question !== "object") return "This question is not available.";

    const text = isBlank(value) ? "" : String(value).trim();

    if (question.required && text === "") {
      return "This field is required. Please fill in your answer.";
    }
    /* An empty optional field is perfectly valid. */
    if (text === "") return "";

    const rules = Object.assign({}, TYPE_RULES[question.type] || {}, FIELD_RULES[question.id] || {});

    if (rules.minLength && text.length < rules.minLength) {
      return rules.minLengthMessage || "Please enter a little more detail.";
    }
    if (rules.mustContainLetter && !LETTER_PATTERN.test(text)) {
      return "Please enter a name using letters.";
    }
    if (rules.pattern && !rules.pattern.test(text)) {
      return rules.message;
    }
    if (rules.kind === "date") {
      return validateDateOfBirth(text);
    }
    if (question.type === "select" && Array.isArray(question.options) && question.options.indexOf(text) === -1) {
      return "Please choose one of the listed options.";
    }
    if (question.id === "address") {
      return validateAddressPin(text);
    }
    return "";
  }

  /* --------------------------------------------------------- review structure */

  /* Plain metadata for every question, used by the review screen and the PDF
   * so both always show the same fields in the same order. */
  function getFieldDefinitions(questions) {
    return asQuestions(questions).map(question => ({
      id: question.id,
      label: question.label || question.id,
      step: question.step,
      title: question.title,
      type: question.type,
      required: !!question.required
    }));
  }

  /* Builds the organised review structure: one section per step, each with
   * the collected value and the validation state of that field.
   *
   * Every entry holds:
   *   id, label, step, title, required - which question the row belongs to
   *   value                            - the answer exactly as it will be saved
   *   display                          - the value, or "Not provided"
   *   hasValue, missing, valid, message */
  function getReviewStructure(answers, questions) {
    const data = asAnswers(answers);
    const sections = [];
    let current = null;

    asQuestions(questions).forEach(question => {
      const value = isBlank(data[question.id]) ? "" : String(data[question.id]).trim();
      const message = validate(question, value);
      const key = String(question.step) + "|" + question.title;

      if (!current || current.key !== key) {
        current = { key: key, step: question.step, title: question.title, fields: [] };
        sections.push(current);
      }
      current.fields.push({
        id: question.id,
        label: question.label || question.id,
        step: question.step,
        title: question.title,
        required: !!question.required,
        value: value,
        display: value || "Not provided",
        hasValue: value !== "",
        missing: value === "" && !!question.required,
        valid: message === "",
        message: message
      });
    });

    /* The uploaded document is collected outside the question list, so it is
     * added as its own optional section. */
    const fileName = isBlank(data.documentName) ? "" : String(data.documentName).trim();
    const extracted = isBlank(data.documentTextExtracted) ? "" : String(data.documentTextExtracted).trim();
    if (fileName || extracted) {
      sections.push({
        key: "5|Supporting document",
        step: 5,
        title: "Supporting document",
        fields: [
          {
            id: "documentName",
            label: "Uploaded file",
            step: 5,
            title: "Supporting document",
            required: false,
            value: fileName,
            display: fileName || "Not provided",
            hasValue: fileName !== "",
            missing: false,
            valid: true,
            message: ""
          },
          {
            id: "documentTextExtracted",
            label: "Readable text in PDF",
            step: 5,
            title: "Supporting document",
            required: false,
            value: extracted,
            display: extracted || "Not provided",
            hasValue: extracted !== "",
            missing: false,
            valid: true,
            message: ""
          }
        ]
      });
    }

    return sections;
  }

  /* Validates the whole application.
   *
   * The result tells the review screen exactly what is wrong and where, and it
   * decides whether the PDF may be generated at all. */
  function validateAll(answers, questions) {
    const data = asAnswers(answers);
    const sections = getReviewStructure(data, questions);
    const issues = [];

    sections.forEach(section => {
      section.fields.forEach(field => {
        if (!field.valid) {
          issues.push({
            id: field.id,
            label: field.label,
            step: field.step,
            message: field.message,
            missing: field.missing
          });
        }
      });
    });

    /* A file name without a matching extraction result means the upload did
     * not finish, so the document step has to be repeated or skipped. */
    if (!isBlank(data.documentName) && isBlank(data.documentTextExtracted)) {
      issues.push({
        id: "documentName",
        label: "Uploaded file",
        step: 5,
        message: "The uploaded document was not processed. Please upload it again or skip the document step.",
        missing: false
      });
    }

    const missing = issues.filter(issue => issue.missing);
    const invalid = issues.filter(issue => !issue.missing);

    return {
      valid: issues.length === 0,
      complete: missing.length === 0,
      issues: issues,
      missing: missing,
      invalid: invalid,
      sections: sections,
      summary: issues.length === 0
        ? "All required information has been provided."
        : "Please correct " + issues.length + (issues.length === 1 ? " answer" : " answers") + " before generating your application."
    };
  }

  /* Looks up a single issue, so the frontend can focus one specific field. */
  function getIssue(result, id) {
    if (!result || !Array.isArray(result.issues)) return null;
    return result.issues.find(issue => issue.id === id) || null;
  }

  window.VagmitraValidation = {
    validate: validate,
    validateAll: validateAll,
    getFieldDefinitions: getFieldDefinitions,
    getReviewStructure: getReviewStructure,
    getIssue: getIssue
  };

  /* ---------------------------------------------------------------- privacy */

  window.VagmitraPrivacy = {
    /* Removes every answer held in memory for this session. The dialogue
     * controller owns the answers, so it is asked to reset itself. Only the
     * number of cleared answers is returned - never their content. */
    clearSession(dialogue) {
      if (!dialogue || typeof dialogue.reset !== "function") return 0;
      const count = dialogue.answers ? Object.keys(dialogue.answers).length : 0;
      dialogue.reset();
      return count;
    },

    /* Releases the temporary blob URL that was created for a generated PDF,
     * so the file is not kept open by the browser after the download. */
    releaseObjectUrl(url) {
      if (typeof url !== "string" || url.indexOf("blob:") !== 0) return false;
      if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(url);
        return true;
      }
      return false;
    },

    /* Removes control characters so text is safe to render. Line breaks are
     * kept, because the reason for an application may span several lines. */
    scrubText(value) {
      if (isBlank(value)) return "";
      return String(value)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
        .replace(/[ \t]+/g, " ");
    },

    /* Describes the session for the status line. It only ever counts answers,
     * it never reads or shows their content. */
    describeSession(dialogue) {
      const count = dialogue && dialogue.answers ? Object.keys(dialogue.answers).length : 0;
      return count + (count === 1 ? " answer held in memory" : " answers held in memory");
    }
  };
})();
