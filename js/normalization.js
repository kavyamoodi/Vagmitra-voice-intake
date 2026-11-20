/* Kajal: normalize common user-entered values without changing their meaning. */
window.VagmitraNormalize = {
  phone(value) { return String(value || "").replace(/[^\d+]/g, "").trim(); },
  whitespace(value) { return String(value || "").trim().replace(/\s+/g, " "); },
  date(value) { return value || ""; },
  email(value) { return String(value || "").trim().toLowerCase(); }
};
