import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

/**
 * The house's letterhead.
 *
 * Set in Georgia rather than Cormorant: an email client that does not have the
 * font falls back to something, and a serif falling back to a serif keeps the
 * register. Web fonts in email are unreliable to the point of not being worth
 * the bytes.
 *
 * Layout is deliberately plain — one column, generous space, one gold rule.
 * A default receipt template would undo the work the rest of the site does.
 */
export const palette = {
  ground: "#f4ede2",
  paper: "#fbf7f1",
  ink: "#221822",
  muted: "#6b6058",
  gold: "#c9a24a",
  line: "#e0d5c6",
};

const serif = "Georgia, 'Times New Roman', serif";
const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export function Shell({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      {/* The line the inbox shows beside the subject. Worth writing. */}
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: palette.ground, fontFamily: sans }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 24px" }}>
          <Text
            style={{
              fontFamily: serif,
              fontSize: "20px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: palette.ink,
              margin: "0 0 4px",
            }}
          >
            Folks &amp; Florets
          </Text>
          <Text style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: palette.muted, margin: 0 }}>
            The Art of Keeping
          </Text>

          <Hr style={{ borderColor: palette.gold, borderWidth: "1px 0 0", margin: "24px 0 32px" }} />

          <Section style={{ backgroundColor: palette.paper, padding: "32px 28px", border: `1px solid ${palette.line}` }}>
            {children}
          </Section>

          <Text style={{ fontSize: "12px", lineHeight: "1.7", color: palette.muted, marginTop: "28px" }}>
            The Botanical Studio, Kotagiri, Nilgiris
            <br />
            Preserved botanicals keep dry and out of direct sun. Never leave a
            lit candle unattended.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontFamily: serif, fontSize: "26px", lineHeight: "1.2", color: palette.ink, margin: "0 0 16px" }}>
      {children}
    </Text>
  );
}

export function Paragraph({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontSize: "15px", lineHeight: "1.7", color: palette.ink, margin: "0 0 16px" }}>
      {children}
    </Text>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: palette.muted, margin: "24px 0 8px" }}>
      {children}
    </Text>
  );
}
