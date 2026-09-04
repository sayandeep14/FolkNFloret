import "server-only";
import { Resend } from "resend";
import type { ReactElement } from "react";

/**
 * Transactional mail.
 *
 * Two rules, both about not letting the post office break the shop:
 *
 *  1. **Sending never throws into the caller.** A failure here is logged and
 *     swallowed. An order that is paid but whose receipt bounced is a support
 *     ticket; a webhook that 500s because Resend was briefly down is a retry
 *     storm and an order stuck in PENDING.
 *  2. **No key means no mail, not a crash.** The shop sells without it.
 */

const from = () => process.env.EMAIL_FROM ?? "crew@folknfloret.com";

let client: Resend | null | undefined;
function resend(): Resend | null {
  if (client !== undefined) return client;
  const key = process.env.AUTH_RESEND_KEY;
  client = key ? new Resend(key) : null;
  return client;
}

export const emailConfigured = () => Boolean(process.env.AUTH_RESEND_KEY);

export type SendResult = { sent: boolean; id?: string; error?: string };

export async function send(message: {
  to: string;
  subject: string;
  react: ReactElement;
  /** Shown in the inbox preview line under the subject. */
  replyTo?: string;
}): Promise<SendResult> {
  const api = resend();
  if (!api) {
    console.warn(`[email] no AUTH_RESEND_KEY; would have sent "${message.subject}" to ${message.to}`);
    return { sent: false, error: "not configured" };
  }

  try {
    const { data, error } = await api.emails.send({
      from: `Folks & Florets <${from()}>`,
      to: message.to,
      subject: message.subject,
      react: message.react,
      replyTo: message.replyTo ?? from(),
    });

    if (error) {
      console.error(`[email] "${message.subject}" to ${message.to} failed:`, error);
      return { sent: false, error: error.message };
    }
    return { sent: true, id: data?.id };
  } catch (error) {
    console.error(`[email] "${message.subject}" to ${message.to} threw:`, error);
    return { sent: false, error: error instanceof Error ? error.message : "unknown" };
  }
}
