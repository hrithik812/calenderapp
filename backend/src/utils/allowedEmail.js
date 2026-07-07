const ALLOWED_EMAIL_DOMAINS = [
  "shantasecurites.com",
  "shanta-aml.com",
  "shantaequity.net",
];

const isAllowedEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const domain = email.trim().toLowerCase().split("@")[1];
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

const allowedEmailMessage =
  "Registration is only allowed with @shantasecurites.com, @shanta-aml.com, or @shantaequity.net email addresses.";

module.exports = { ALLOWED_EMAIL_DOMAINS, isAllowedEmail, allowedEmailMessage };
