import type { ReactNode } from "react";

import styles from "./Panel.module.scss";

/** Plain surface container: the card used for forms and detail sections. */
export default function Panel({
  title,
  className,
  children,
}: {
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={[styles.panel, className].filter(Boolean).join(" ")}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {children}
    </section>
  );
}
