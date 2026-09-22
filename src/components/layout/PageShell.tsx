import type { ReactNode } from "react";

import styles from "./PageShell.module.scss";

interface PageShellProps {
  title: string;
  /** Small uppercase label above the title, e.g. a breadcrumb-ish context. */
  eyebrow?: string;
  description?: string;
  /** Page-level buttons; wraps under the title on narrow screens. */
  actions?: ReactNode;
  children: ReactNode;
}

/** Shared width, gutters and page-header rhythm for every signed-in page. */
export default function PageShell({
  title,
  eyebrow,
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <main id="main" className={styles.main}>
      <div className={styles.head}>
        <div className={styles.heading}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {children}
    </main>
  );
}
