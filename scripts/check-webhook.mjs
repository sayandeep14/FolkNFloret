/**
 * Confirms the Razorpay webhook endpoint is reachable and enforcing its
 * signature at the host you registered.
 *
 * A webhook that 308s is the quietest possible failure: Razorpay does not
 * follow redirects, so every delivery is dropped, orders never leave PENDING,
 * and nothing anywhere says why. This sends a deliberately unsigned payload —
 * a correct endpoint answers 400.
 *
 *   npm run check:webhook -- https://www.folknfloret.com
 */
const host = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const url = `${host}/api/webhooks/razorpay`;

const response = await fetch(url, {
  method: "POST",
  redirect: "manual",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ event: "reachability.check" }),
});

if (response.status >= 300 && response.status < 400) {
  console.error(
    `\n✗ ${url}\n  answers ${response.status} → ${response.headers.get("location")}\n\n` +
      `  Razorpay does not follow redirects. Register the target host instead,\n` +
      `  or every webhook delivery is dropped without a trace.\n`,
  );
  process.exit(1);
}

if (response.status === 400) {
  console.log(`\n✓ ${url}\n  400 on an unsigned payload — reachable and verifying signatures.\n`);
  process.exit(0);
}

if (response.status === 503) {
  console.error(`\n✗ ${url}\n  503 — RAZORPAY_WEBHOOK_SECRET is not set on this deployment.\n`);
  process.exit(1);
}

console.error(
  `\n? ${url}\n  answered ${response.status}, which was not expected.\n` +
    `  400 means healthy; 308 means the wrong host; 503 means no secret.\n`,
);
process.exit(1);
