const parseAdminEmails = () => {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
};

const isAdminEmail = (email) => {
  if (!email) return false;
  const adminEmails = parseAdminEmails();
  if (adminEmails.length === 0) return false;
  return adminEmails.includes(String(email).toLowerCase());
};

module.exports = { isAdminEmail };
