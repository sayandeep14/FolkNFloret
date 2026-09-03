import { suites } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SplitHeading } from "@/components/SplitHeading";

/**
 * The tier ladder — statement, ritual, suite. Shares the Craft section's split
 * shell and numbered rows deliberately: this is the same reading rhythm one
 * beat later, not a new pattern, so the page still feels like one document.
 */
export function Suites() {
  return (
    <section id="suites" className="section section--craft">
      <div className="shell shell--split">
        <Reveal className="craft__aside">
          <p className="eyebrow">{suites.eyebrow}</p>
          <SplitHeading lines={suites.titleLines} className="display display--md" />
          <p className="lede">{suites.body}</p>
        </Reveal>

        <ol className="steps">
          {suites.items.map((item) => (
            <li key={item.no}>
              <Reveal className="step">
                <span className="step__no">{item.no}</span>
                <h3 className="step__name">{item.name}</h3>
                <p className="step__text">{item.body}</p>
                <p className="step__meta">{item.meta}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
