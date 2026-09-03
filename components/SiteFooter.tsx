import { brand, footer } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <p className="site-footer__mark">
              Folks <i aria-hidden="true">&amp;</i> Florets
            </p>
            <p className="site-footer__tagline">{brand.tagline}</p>
            <p className="site-footer__address">{footer.address}</p>
          </div>

          <div className="site-footer__columns">
            {footer.columns.map((column) => (
              <div key={column.title} className="site-footer__column">
                <h3>{column.title}</h3>
                <ul>
                  {column.links.map((link) => (
                    <li key={link}>
                      <a href="#invitation">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="site-footer__legal">{footer.legal}</p>
      </div>
    </footer>
  );
}
