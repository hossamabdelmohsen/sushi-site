const ADMIN_EMAILS = [
  "sushib0ooo0x@gmail.com",
  "hossamabdelmohsen6@gmail.com",
  "hossammessi213@gmail.com"
];

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isAdminEmail(value) {
  const email = normalizeEmail(value);
  return Boolean(email && ADMIN_EMAILS.some((adminEmail) => normalizeEmail(adminEmail) === email));
}

function isAdminUser(user) {
  return isAdminEmail(user && user.email);
}

module.exports = {
  ADMIN_EMAILS,
  normalizeEmail,
  isAdminEmail,
  isAdminUser
};
