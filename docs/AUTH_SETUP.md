# Sign-in setup

Two providers, independent of each other. Set up whichever you want; the site
offers exactly the ones whose keys are present, and sells perfectly well with
neither — checkout works as a guest.

Google Cloud renames its menus regularly. Where this guide names a screen and
you cannot find it, look for the value described rather than the label.

---

## The callback URL

Both providers need to know where to send the browser back to. For this app it
is always:

```
https://YOUR-DOMAIN/api/auth/callback/google
```

That path is not arbitrary — it is where `app/api/auth/[...nextauth]/route.ts`
lives, and changing it means also setting `basePath` in `auth.ts`. Get it wrong
by a character and Google returns `redirect_uri_mismatch`, which is the single
most common failure here.

---

## Google

### 1. A project

1. Go to **console.cloud.google.com**.
2. Project dropdown, top left → **New Project**. Name it `Folks & Florets`.
   Skip if you already have one you want to use.

### 2. The consent screen

This is what people see when they click "Continue with Google". Google will not
issue credentials until it exists.

1. **APIs & Services → OAuth consent screen** (newer consoles: **Google Auth
   Platform → Branding**).
2. **User type: External.** Internal only exists for Google Workspace
   organisations and would limit sign-in to your own domain.
3. Fill in:
   - **App name** — `Folks & Florets`. This is shown on the consent screen, so
     use the customer-facing name.
   - **User support email** — yours.
   - **App logo** — optional. Uploading one triggers Google's brand
     verification, which can take days. Skip it for now.
   - **Application home page** — `https://folknfloret.com`
   - **Authorised domains** — `folknfloret.com`
   - **Developer contact** — yours.
4. **Scopes: add none.** The defaults (`openid`, `email`, `profile`) are all
   this app asks for, and they are what keep you out of Google's verification
   review. Adding anything Google classes as sensitive turns a five-minute job
   into a multi-week one.

### 3. Publishing status — do not skip this

On the same screen, find **Publishing status**.

- **Testing** — only email addresses you list as test users can sign in, at
  most 100 of them, and their sessions expire after 7 days.
- **In production** — anyone can sign in.

Press **Publish app**. Because you are only using the basic scopes, this does
*not* send you into Google's verification queue. Leaving it on Testing is the
second most common failure here, and it fails silently for everyone except you.

### 4. The credentials

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. **Application type: Web application.**
3. Name it something you will recognise later, e.g. `folknfloret-web`.
4. **Authorised JavaScript origins** — add:
   ```
   https://folknfloret.com
   http://localhost:3000
   ```
5. **Authorised redirect URIs** — add both, exactly:
   ```
   https://folknfloret.com/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```
   No trailing slash. `http` for localhost, `https` for the domain.
6. **Create.** Google shows the **Client ID** and **Client secret** once, in a
   dialog. The secret can be re-revealed later from the same page, but copy
   both now.

### 5. Into the environment

`.env.local` for development:

```
AUTH_GOOGLE_ID="123456789-abc123.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-..."
```

Vercel → **Settings → Environment Variables**, for Production and Preview:
the same two, plus `AUTH_SECRET`, which is already in your `.env.local` and
**is not yet on Vercel**. Without it, sessions cannot be signed.

Also set, in production only:

```
AUTH_URL="https://folknfloret.com"
```

Auth.js otherwise builds the callback from whatever host the request arrived
on. Someone landing on the `*.vercel.app` address would generate a callback URL
Google has never heard of, and the sign-in fails. Pinning it avoids registering
every Vercel domain you will ever have.

### Preview deployments

Vercel gives every deployment a unique URL, and Google will not accept
wildcards in a redirect URI. So **Google sign-in does not work on preview
deployments** unless you register that specific URL. Two options: use a stable
preview domain in Vercel and register it, or test Google sign-in on production
and localhost only. Magic link has no such problem.

---

## Resend, for the magic link

The primary method, and the one worth having first — no password to leak and no
reset flow to build.

1. Sign up at **resend.com**.
2. **Domains → Add Domain** → `folknfloret.com`. Resend gives you DKIM and SPF
   records; add them at your DNS provider and wait for it to verify.
   **Do not skip the domain.** Resend's shared sending address will land a
   sign-in link in spam, and a sign-in link in spam means nobody signs in.
3. **API Keys → Create API Key**, with *Sending access*.
4. Into the environment:
   ```
   AUTH_RESEND_KEY="re_..."
   EMAIL_FROM="hello@folknfloret.com"
   ```
   `EMAIL_FROM` must be on the domain you verified.

While you are configuring DNS, add **DMARC** too — `_dmarc.folknfloret.com`
with `v=DMARC1; p=none; rua=mailto:you@folknfloret.com`. It is a Phase 11 item
but the DNS is already in front of you.

---

## Checking it worked

```bash
curl -s https://folknfloret.com/api/auth/providers
```

Returns `{}` when nothing is configured, and lists each provider once its keys
are present. If a provider is missing after you set its keys, the deployment
has not picked up the new environment variables — redeploy.

Then sign in at `/signin` and confirm a `User` row appears.

---

## One decision worth knowing

`auth.ts` sets `allowDangerousEmailAccountLinking: true` on Google. Someone who
first signed in by magic link and later uses Google with the same address gets
the same account, rather than a second one and a confusing error.

The flag is named alarmingly because linking on an unverified email would let
an attacker claim an account by signing up with someone else's address at a
provider that never checked it. Google verifies its addresses, so the risk does
not apply here. Do not copy the flag to a provider that does not.
