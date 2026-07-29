import Image from "next/image";
import { invitation } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SplitHeading } from "@/components/SplitHeading";
import { Magnetic } from "@/components/Magnetic";

export function Invitation() {
  return (
    <section id="invitation" className="section section--invitation">
      {/* The night aerial closes the arc the journey opened at dawn. Its upper
          sky is deliberately calm, which is where the headline sits. */}
      <div className="invitation__bg" aria-hidden="true">
        <Image
          src={invitation.image.src}
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "50% 60%" }}
        />
      </div>

      <div className="shell shell--narrow">
        <Reveal>
          <p className="eyebrow eyebrow--center">{invitation.eyebrow}</p>
        </Reveal>

        <SplitHeading
          lines={invitation.title}
          className="display display--lg"
        />

        <Reveal>
          <p className="lede lede--center">{invitation.body}</p>
          <div className="actions">
            <Magnetic>
              <a className="button button--solid" href={invitation.primary.href}>
                <span>{invitation.primary.label}</span>
                <b aria-hidden="true">↗</b>
              </a>
            </Magnetic>
            <Magnetic strength={0.25}>
              <a
                className="button button--quiet"
                href={invitation.secondary.href}
              >
                <span>{invitation.secondary.label}</span>
              </a>
            </Magnetic>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
