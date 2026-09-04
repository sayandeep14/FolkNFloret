/**
 * Prints the exact redirect_uri this deployment hands an OAuth provider.
 *
 * `redirect_uri_mismatch` is the most common OAuth failure and the least
 * informative: the provider will not tell you what it received, and guessing
 * between apex and www, http and https, trailing slash or not, is a slow way
 * to find out. This walks the handshake far enough to read the value and stops
 * before any credential is involved.
 *
 *   npm run check:oauth -- https://www.folknfloret.com
 *   npm run check:oauth                        # defaults to localhost:3000
 */
const host = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const provider = process.argv[3] ?? "google";

function cookiesFrom(response) {
  return (response.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .join("; ");
}

const csrfResponse = await fetch(`${host}/api/auth/csrf`, { redirect: "manual" });

if (csrfResponse.status >= 300 && csrfResponse.status < 400) {
  console.error(
    `\n${host} redirects to ${csrfResponse.headers.get("location")}\n` +
      `That redirect target is your canonical host — run this against it instead.\n` +
      `Auth.js builds the callback from the host it is actually served on, so\n` +
      `the canonical host is what has to be registered with the provider.\n`,
  );
  process.exit(1);
}

const { csrfToken } = await csrfResponse.json();
const cookies = cookiesFrom(csrfResponse);

const signIn = await fetch(`${host}/api/auth/signin/${provider}`, {
  method: "POST",
  redirect: "manual",
  headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: cookies },
  body: new URLSearchParams({ csrfToken, callbackUrl: `${host}/account` }),
});

const location = signIn.headers.get("location");
if (!location) {
  console.error(`No redirect from ${host}. Is "${provider}" configured on this deployment?`);
  process.exit(1);
}

const url = new URL(location);
if (!url.hostname.includes("google") && !url.searchParams.get("redirect_uri")) {
  console.error(`Unexpected redirect to ${location.slice(0, 120)}`);
  process.exit(1);
}

console.log(`\nauthorize host  ${url.origin}`);
console.log(`client_id       ${(url.searchParams.get("client_id") ?? "").slice(0, 28)}…`);
console.log(`\nRegister this EXACTLY as an Authorised redirect URI:\n`);
console.log(`  ${url.searchParams.get("redirect_uri")}\n`);
