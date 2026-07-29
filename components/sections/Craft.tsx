import Image from "next/image";
import { craft } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SplitHeading } from "@/components/SplitHeading";

export function Craft() {
  return (
    <section id="craft" className="section section--craft">
      <div className="shell shell--split">
        {/* Sticks while the steps scroll past it. The Reveal carries the class
            itself so its flex gap applies to the copy, not to a lone wrapper. */}
        <Reveal className="craft__aside">
          <p className="eyebrow">{craft.eyebrow}</p>
          <SplitHeading lines={craft.title} className="display display--md" />
          <p className="lede">{craft.body}</p>
          {/* Fills the sticky column, which was otherwise empty beside the steps. */}
          <figure className="craft__figure">
            <Image
              src={craft.image.src}
              alt={craft.image.alt}
              fill
              sizes="(max-width: 960px) 92vw, 38vw"
              style={{ objectFit: "cover", objectPosition: "58% 50%" }}
            />
          </figure>
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
