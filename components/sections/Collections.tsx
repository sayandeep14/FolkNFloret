import { collections } from "@/lib/content";
import { Reveal } from "@/components/Reveal";

export function Collections() {
  return (
    <section id="collections" className="section section--collections">
      <div className="shell">
        <Reveal className="section__head">
          <p className="eyebrow">{collections.eyebrow}</p>
          <h2 className="display display--md">{collections.title}</h2>
          <p className="lede">{collections.body}</p>
        </Reveal>

        <Reveal className="cards" stagger>
          {collections.items.map((item) => (
            <article key={item.no} className="card">
              <span className="card__no">{item.no}</span>
              <div className="card__body">
                <p className="card__latin">{item.latin}</p>
                <h3 className="card__name">{item.name}</h3>
                <p className="card__text">{item.body}</p>
              </div>
              <footer className="card__foot">
                <span>{item.meta}</span>
                <b aria-hidden="true">↗</b>
              </footer>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
