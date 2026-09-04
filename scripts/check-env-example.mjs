/**
 * Fails if .env.example contains anything that looks like a real credential.
 *
 * This file is the one env file that is committed, which makes it the natural
 * place to paste a value "just to try it" — and it has now caught a live
 * database password and a live Resend key that way. GitHub's push protection
 * stopped the second one; this stops the next before it reaches a commit.
 *
 *   npm run check:env
 */
import { readFileSync } from "node:fs";

const FILE = ".env.example";

/** Vendor prefixes that are never a placeholder. */
const KNOWN_SECRET = [
  /^re_[A-Za-z0-9]/,          // Resend
  /^rzp_(test|live)_/,        // Razorpay
  /^sk_(test|live)_/,         // Stripe-style
  /^GOCSPX-\w/,               // Google OAuth secret
  /^sb(p)?_[a-z]/,            // Supabase
  /^eyJ[A-Za-z0-9_-]{10,}\./, // JWT
];

/** Words that mark a value as deliberately fake. */
const PLACEHOLDER =
  /(\.\.\.|YOUR|EXAMPLE|PLACEHOLDER|CHANGEME|PROJECTREF|PASSWORD|user:password|localhost|folksflorets:folksflorets)/i;

const problems = [];

readFileSync(FILE, "utf8")
  .split("\n")
  .forEach((line, index) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (!match) return;
    const [, key, value] = match;
    if (!value) return;

    const where = `${FILE}:${index + 1} ${key}`;

    if (KNOWN_SECRET.some((pattern) => pattern.test(value))) {
      problems.push(`${where} looks like a real credential.`);
      return;
    }

    if (PLACEHOLDER.test(value)) return;

    // A long opaque value with no placeholder wording is the shape of a
    // secret. An email address or a short word is not.
    if (value.length >= 24 && !value.includes("@") && !value.includes(" ")) {
      problems.push(`${where} is ${value.length} characters and does not read as a placeholder.`);
    }
  });

if (problems.length) {
  console.error(`\n${FILE} must contain placeholders only.\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(`\nMove the real value to .env.local, which is gitignored.\n`);
  process.exit(1);
}

console.log(`${FILE} contains no real credentials.`);
