import { Button, Column, Hr, Row, Text } from "@react-email/components";
import { Heading, Label, palette, Paragraph, Shell } from "./Shell";
import { formatPaise } from "@/lib/money";

/**
 * The five letters an order can send. All take the same plain shape so the
 * callers do not have to know which template wants which field.
 */
export type OrderEmailData = {
  orderNumber: string;
  email: string;
  items: { title: string; variant?: string | null; quantity: number; unitPriceInPaise: number }[];
  subtotalInPaise: number;
  shippingInPaise: number;
  discountInPaise: number;
  taxInPaise: number;
  totalInPaise: number;
  shipping: { name: string; line1: string; line2?: string | null; city: string; state: string; pincode: string };
  isGift: boolean;
  giftRecipient?: string | null;
  giftMessage?: string | null;
  requestedFor?: Date | null;
  siteUrl: string;
};

function Lines({ data }: { data: OrderEmailData }) {
  return (
    <>
      <Label>Your order</Label>
      {data.items.map((item, index) => (
        <Row key={index} style={{ marginBottom: "8px" }}>
          <Column>
            <Text style={{ fontSize: "14px", color: palette.ink, margin: 0 }}>
              {item.title}
              {item.variant ? ` — ${item.variant}` : ""}
            </Text>
            <Text style={{ fontSize: "12px", color: palette.muted, margin: 0 }}>×{item.quantity}</Text>
          </Column>
          <Column align="right" style={{ verticalAlign: "top" }}>
            <Text style={{ fontSize: "14px", color: palette.ink, margin: 0 }}>
              {formatPaise(item.unitPriceInPaise * item.quantity)}
            </Text>
          </Column>
        </Row>
      ))}

      <Hr style={{ borderColor: palette.line, margin: "16px 0" }} />

      {[
        ["Subtotal", formatPaise(data.subtotalInPaise)],
        ...(data.discountInPaise > 0 ? [["Discount", `−${formatPaise(data.discountInPaise)}`] as const] : []),
        ["Delivery", data.shippingInPaise === 0 ? "Complimentary" : formatPaise(data.shippingInPaise)],
      ].map(([label, value]) => (
        <Row key={label}>
          <Column>
            <Text style={{ fontSize: "13px", color: palette.muted, margin: "0 0 4px" }}>{label}</Text>
          </Column>
          <Column align="right">
            <Text style={{ fontSize: "13px", color: palette.muted, margin: "0 0 4px" }}>{value}</Text>
          </Column>
        </Row>
      ))}

      <Row>
        <Column>
          <Text style={{ fontSize: "16px", color: palette.ink, margin: "8px 0 0" }}>Total</Text>
        </Column>
        <Column align="right">
          <Text style={{ fontSize: "16px", color: palette.ink, margin: "8px 0 0" }}>
            {formatPaise(data.totalInPaise)}
          </Text>
        </Column>
      </Row>
      {/* Prices are GST-inclusive throughout, so the tax is stated, not added. */}
      <Text style={{ fontSize: "11px", color: palette.muted, margin: "4px 0 0" }}>
        Includes GST of {formatPaise(data.taxInPaise)}.
      </Text>
    </>
  );
}

function Address({ data }: { data: OrderEmailData }) {
  return (
    <>
      <Label>Delivering to</Label>
      <Text style={{ fontSize: "14px", lineHeight: "1.6", color: palette.ink, margin: 0 }}>
        {data.shipping.name}
        <br />
        {data.shipping.line1}
        {data.shipping.line2 ? (
          <>
            <br />
            {data.shipping.line2}
          </>
        ) : null}
        <br />
        {data.shipping.city}, {data.shipping.state} {data.shipping.pincode}
      </Text>
    </>
  );
}

function TrackLink({ data, label }: { data: OrderEmailData; label: string }) {
  return (
    <Button
      href={`${data.siteUrl}/track?order=${data.orderNumber}&email=${encodeURIComponent(data.email)}`}
      style={{
        backgroundColor: palette.ink,
        color: palette.ground,
        fontSize: "12px",
        letterSpacing: "2px",
        textTransform: "uppercase",
        padding: "14px 26px",
        borderRadius: "999px",
        textDecoration: "none",
        display: "inline-block",
        marginTop: "24px",
      }}
    >
      {label}
    </Button>
  );
}

export function OrderConfirmation({ data }: { data: OrderEmailData }) {
  return (
    <Shell preview={`Order ${data.orderNumber} is confirmed`}>
      <Heading>Thank you.</Heading>
      <Paragraph>
        Your order <strong>{data.orderNumber}</strong> is confirmed and is being
        composed. We will write again the moment it leaves the studio.
      </Paragraph>

      {data.isGift ? (
        <>
          <Label>Given as a gift</Label>
          <Paragraph>
            {data.giftRecipient ? <>For {data.giftRecipient}. </> : null}
            No prices will travel with the parcel.
          </Paragraph>
          {data.giftMessage ? (
            <Text style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "16px", color: palette.ink, borderLeft: `2px solid ${palette.gold}`, paddingLeft: "14px", margin: "0 0 16px" }}>
              “{data.giftMessage}”
            </Text>
          ) : null}
          {data.requestedFor ? (
            <Paragraph>
              You asked for delivery around{" "}
              {data.requestedFor.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}.
              We will do our best.
            </Paragraph>
          ) : null}
        </>
      ) : null}

      <Lines data={data} />
      <Address data={data} />
      <TrackLink data={data} label="Track this order" />
    </Shell>
  );
}

export function PaymentFailed({ data }: { data: OrderEmailData }) {
  return (
    <Shell preview={`Payment for ${data.orderNumber} did not go through`}>
      <Heading>That payment did not go through.</Heading>
      <Paragraph>
        Nothing has been charged. Your pieces are held for a short while longer,
        so you can try again on the same order.
      </Paragraph>
      <TrackLink data={data} label="Try again" />
      <Text style={{ fontSize: "13px", color: palette.muted, marginTop: "24px" }}>
        If it keeps failing, reply to this email and we will take the order by
        hand.
      </Text>
    </Shell>
  );
}

export function OrderShipped({
  data,
  courier,
  awb,
  trackingUrl,
}: {
  data: OrderEmailData;
  courier?: string | null;
  awb?: string | null;
  trackingUrl?: string | null;
}) {
  return (
    <Shell preview={`Order ${data.orderNumber} is on its way`}>
      <Heading>It has left the studio.</Heading>
      <Paragraph>
        {data.isGift && data.giftRecipient
          ? `Your gift for ${data.giftRecipient} is on its way.`
          : "Your order is on its way."}{" "}
        Everything travels in cut foam under velvet — nothing is packed loose.
      </Paragraph>

      {awb ? (
        <>
          <Label>Tracking</Label>
          <Text style={{ fontSize: "14px", color: palette.ink, margin: 0 }}>
            {courier ?? "Courier"} · {awb}
          </Text>
        </>
      ) : null}

      <Address data={data} />

      {trackingUrl ? (
        <Button
          href={trackingUrl}
          style={{
            backgroundColor: palette.ink,
            color: palette.ground,
            fontSize: "12px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            padding: "14px 26px",
            borderRadius: "999px",
            textDecoration: "none",
            display: "inline-block",
            marginTop: "24px",
          }}
        >
          Track the parcel
        </Button>
      ) : (
        <TrackLink data={data} label="View this order" />
      )}
    </Shell>
  );
}

export function OrderDelivered({ data }: { data: OrderEmailData }) {
  return (
    <Shell preview={`Order ${data.orderNumber} has arrived`}>
      <Heading>It has arrived.</Heading>
      <Paragraph>
        {data.isGift && data.giftRecipient
          ? `Your gift reached ${data.giftRecipient}.`
          : "Your order has been delivered."}
      </Paragraph>
      <Paragraph>
        Preserved botanicals want dry hands and no direct sun. Candles want the
        wick trimmed to 5mm before each burn, and never to be left alone.
      </Paragraph>
      <Text style={{ fontSize: "13px", color: palette.muted, marginTop: "8px" }}>
        If anything arrived less than perfectly, reply to this email — we would
        rather know.
      </Text>
    </Shell>
  );
}

export function OrderRefunded({ data }: { data: OrderEmailData }) {
  return (
    <Shell preview={`Refund for ${data.orderNumber}`}>
      <Heading>Your refund is on its way.</Heading>
      <Paragraph>
        We have refunded {formatPaise(data.totalInPaise)} for order{" "}
        <strong>{data.orderNumber}</strong>. Banks usually take five to seven
        working days to show it.
      </Paragraph>
      <Text style={{ fontSize: "13px", color: palette.muted }}>
        If it has not appeared after that, reply to this email with the order
        number and we will chase it.
      </Text>
    </Shell>
  );
}
