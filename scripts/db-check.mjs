/**
 * Answers "is my DATABASE_URL actually going to work?" without running a
 * migration to find out. Reports what each URL points at, whether it connects,
 * and what to do about it if it does not.
 *
 *   npm run db:check
 */
import { Client } from "pg";
import { lookup } from "node:dns/promises";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
    console.log(`env: loaded ${file}\n`);
    break;
  } catch {
    // Fall through to the ambient environment.
  }
}

/** What kind of endpoint is this, judged from host and port alone? */
function describe(url) {
  const u = new URL(url);
  const port = u.port || "5432";
  const pooled = u.hostname.includes("pooler.supabase.com");
  const kind = !pooled
    ? u.hostname.startsWith("db.") && u.hostname.endsWith(".supabase.co")
      ? "Supabase direct connection (IPv6 only on the free plan)"
      : "direct connection"
    : port === "6543"
      ? "Supabase transaction pooler"
      : "Supabase session pooler";
  return { user: u.username, host: u.hostname, port, database: u.pathname.slice(1), kind, pooled, port6543: port === "6543" };
}

/**
 * Does this machine have a route out over IPv6? Worth knowing before blaming
 * an unreachable Supabase host on the network, because plenty of connections
 * do have IPv6 and the real fault is elsewhere.
 */
async function hasIpv6() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    await fetch("https://ifconfig.co", { signal: controller.signal });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

async function probe(label, url) {
  const info = describe(url);
  console.log(`${label}`);
  console.log(`  ${info.kind}`);
  console.log(`  ${info.user}@${info.host}:${info.port}/${info.database}`);

  // Resolve first. A host that does not exist and a host that will not answer
  // are different faults with different fixes, and the connection error alone
  // does not always separate them.
  try {
    await lookup(info.host, { all: true });
  } catch {
    console.log(`  ✗ ${info.host} does not resolve`);
    console.log("  → Either the project reference is wrong, or the project is still");
    console.log("    being created. Check it against the dashboard URL:");
    console.log("    supabase.com/dashboard/project/<THIS-IS-THE-REFERENCE>");
    console.log("    If the project is new, give it a minute and run this again.");
    return false;
  }

  const client = new Client({ connectionString: url, connectionTimeoutMillis: 12000 });
  const started = Date.now();
  try {
    await client.connect();
    const { rows } = await client.query(
      "select current_database() as db, current_user as who, version() as version",
    );
    const tables = await client.query(
      "select count(*)::int as n from information_schema.tables where table_schema = 'public'",
    );
    console.log(`  ✓ connected in ${Date.now() - started}ms as ${rows[0].who}`);
    console.log(`  ${rows[0].version.split(" on ")[0]}`);
    console.log(`  ${tables.rows[0].n} table(s) in the public schema`);
    await client.end();
    return true;
  } catch (error) {
    console.log(`  ✗ ${error.message}`);
    const message = String(error.message);
    if (/ENETUNREACH|ETIMEDOUT|EHOSTUNREACH/.test(message)) {
      // Only blame IPv6 after checking, rather than assuming an Indian network
      // is IPv4-only. Plenty are not.
      if (info.kind.includes("IPv6") && !(await hasIpv6())) {
        console.log("  → This host is IPv6-only and this machine has no IPv6 route out.");
        console.log("    Use the session pooler URL instead (docs/SUPABASE_SETUP.md §2).");
      } else {
        console.log("  → Host resolves but will not answer. Most likely the project is");
        console.log("    paused — free projects pause after 7 days idle. Resume it in");
        console.log("    the dashboard and try again.");
      }
    } else if (/Tenant or user not found/i.test(message)) {
      console.log("  → A pooler URL needs the username `postgres.<projectref>`, not `postgres`.");
    } else if (/password authentication failed/i.test(message)) {
      console.log("  → If the password is right, percent-encode it: @ becomes %40, # becomes %23.");
    }
    return false;
  }
}

const pooled = process.env.DATABASE_URL;
const direct = process.env.DIRECT_URL;

if (!pooled) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const results = [await probe("DATABASE_URL  (the app)", pooled)];
if (direct && direct !== pooled) {
  console.log();
  results.push(await probe("DIRECT_URL    (migrations, seed, studio)", direct));
} else {
  console.log("\nDIRECT_URL    not set — migrations will reuse DATABASE_URL.");
  if (describe(pooled).port6543) {
    console.log(
      "  ⚠ DATABASE_URL is a transaction pooler. Migrations will hang on it:\n" +
      "    Prisma's migration lock is a Postgres advisory lock, and a transaction\n" +
      "    pooler gives each statement a different backend, so the lock is lost.\n" +
      "    Set DIRECT_URL to the session pooler (port 5432) or a direct connection.",
    );
    results.push(false);
  }
}

console.log();
if (results.every(Boolean)) {
  console.log("Ready. Next: npm run db:deploy && npm run db:seed");
} else {
  console.log("Not ready — see above, and docs/SUPABASE_SETUP.md for the fixes.");
  process.exit(1);
}
