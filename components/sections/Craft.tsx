import { craft } from "@/lib/content";
import { Reveal } from "@/components/Reveal";

export function Craft() {
  return (
    <section id="craft" className="section section--craft">
      <div className="shell shell--split">
        {/* Sticks while the steps scroll past it. The Reveal carries the class
            itself so its flex gap applies to the copy, not to a lone wrapper. */}
        <Reveal className="craft__aside">
          <p className="eyebrow">{craft.eyebrow}</p>
          <h2 className="display display--md">{craft.title}</h2>
          <p className="lede">{craft.body}</p>
        </Reveal>

        <ol className="steps">
          {craft.steps.map((step) => (
            <li key={step.no}>
              <Reveal className="step">
                <span className="step__no">{step.no}</span>
                <h3 className="step__name">{step.name}</h3>
                <p className="step__text">{step.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
