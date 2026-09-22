import styles from "./SiteFooter.module.scss";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>Plant Watering Control — proof of concept</span>
        <span>Readings come from a mock sensor layer.</span>
      </div>
    </footer>
  );
}
