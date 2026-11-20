/* Khushi: client-side checks. This prototype does not submit data to a server. */
window.VagmitraValidation = {
  validate(question, value) {
    const v = String(value || "").trim();
    if (question.required && !v) return "This field is required.";
    if (!v) return "";
    if (question.id === "phone" && !/^\+?\d{10,13}$/.test(v.replace(/\s/g,""))) return "Enter a valid phone number (10–13 digits).";
    if (question.id === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
    if (question.id === "dateOfBirth" && new Date(v) > new Date()) return "Date of birth cannot be in the future.";
    return "";
  }
};
