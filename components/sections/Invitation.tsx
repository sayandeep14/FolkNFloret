import { invitation } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SplitHeading } from "@/components/SplitHeading";
import { Magnetic } from "@/components/Magnetic";

export function Invitation() {
  return (
    <section id="invitation" className="section section--invitation">
      <div className="shell shell--narrow">
        <Reveal>
          <p className="eyebrow eyebrow--center">{invitation.eyebrow}</p>
          <SplitHeading lines={invitation.titleLines} className="display display--lg" />
          <p className="lede lede--center">{invitation.body}</p>
          <div className="actions">
            <Magnetic>
              <a className="button button--solid" href={invitation.primary.href}>
                <span>{invitation.primary.label}</span>
                <b aria-hidden="true">↗</b>
              </a>
            </Magnetic>
            <Magnetic strength={0.24}>
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
