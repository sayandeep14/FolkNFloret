import { invitation } from "@/lib/content";
import { Reveal } from "@/components/Reveal";

export function Invitation() {
  return (
    <section id="invitation" className="section section--invitation">
      <div className="shell shell--narrow">
        <Reveal>
          <p className="eyebrow eyebrow--center">{invitation.eyebrow}</p>
          <h2 className="display display--lg">{invitation.title}</h2>
          <p className="lede lede--center">{invitation.body}</p>
          <div className="actions">
            <a className="button button--solid" href={invitation.primary.href}>
              <span>{invitation.primary.label}</span>
              <b aria-hidden="true">↗</b>
            </a>
            <a className="button button--quiet" href={invitation.secondary.href}>
              <span>{invitation.secondary.label}</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
