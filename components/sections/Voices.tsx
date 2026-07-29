import { voices } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SplitHeading } from "@/components/SplitHeading";

export function Voices() {
  return (
    <section className="section section--voices">
      <div className="shell shell--narrow">
        <Reveal>
          <p className="eyebrow eyebrow--center">{voices.eyebrow}</p>
        </Reveal>
        <blockquote className="quote">
          <SplitHeading lines={voices.quote} as="h3" className="quote__text" />
          <Reveal>
            <cite>{voices.attribution}</cite>
          </Reveal>
        </blockquote>
      </div>
    </section>
  );
}
