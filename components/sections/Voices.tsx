import { voices } from "@/lib/content";
import { Reveal } from "@/components/Reveal";

export function Voices() {
  return (
    <section className="section section--voices">
      <div className="shell shell--narrow">
        <Reveal>
          <p className="eyebrow eyebrow--center">{voices.eyebrow}</p>
          <blockquote className="quote">
            <p>{voices.quote}</p>
            <cite>{voices.attribution}</cite>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
