import Link from "next/link";

import SiteHeader from "@/components/layout/SiteHeader";
import { buttonClass } from "@/components/ui/Button";

import styles from "./page.module.scss";

const FEATURES = [
  {
    icon: "📡",
    title: "Live moisture readings",
    body: "Each controller reports moisture, battery and online state. Opening the dashboard pulls a fresh reading — no polling, no sockets.",
  },
  {
    icon: "🪴",
    title: "Plant-aware thresholds",
    body: "Name the plant and the app looks up its preferred moisture range, so 40% reads as healthy for one plant and too dry for another.",
  },
  {
    icon: "📈",
    title: "Reading history",
    body: "Every reading is stored, so you can see whether a plant is drying out steadily or you simply caught it right after watering.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main id="main" className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p className={styles.badge}>
              <span aria-hidden="true">●</span> Proof of concept
            </p>
            <h1 className={styles.title}>
              Know when your plants are{" "}
              <span className={styles.titleAccent}>actually thirsty</span>
            </h1>
            <p className={styles.lede}>
              Connect a moisture meter to each pot and watch every plant from one
              dashboard — current moisture, battery level and a history of how
              fast the soil dries out.
            </p>
            <div className={styles.ctas}>
              <Link
                href="/auth?mode=signup"
                className={buttonClass({ size: "lg" })}
              >
                Get started
              </Link>
              <Link
                href="/auth"
                className={buttonClass({ variant: "secondary", size: "lg" })}
              >
                Log in
              </Link>
            </div>
          </div>

          {/* Static sample of a controller card, purely decorative. */}
          <div className={styles.preview} aria-hidden="true">
            <div className={styles.previewHead}>
              <span className={styles.previewName}>Balcony Sensor</span>
              <span className={styles.previewPlant}>Monstera deliciosa</span>
            </div>
            <div className={styles.gaugeLabel}>
              <span>Moisture</span>
              <strong>62%</strong>
            </div>
            <div className={styles.gauge}>
              <div className={styles.gaugeFill} style={{ width: "62%" }} />
            </div>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Battery</span>
                <span className={styles.statValue}>87%</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Status</span>
                <span className={styles.statValue}>Online</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Checked</span>
                <span className={styles.statValue}>2m ago</span>
              </div>
            </div>
          </div>
        </section>

        <ul className={styles.features}>
          {FEATURES.map((feature) => (
            <li key={feature.title} className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden="true">
                {feature.icon}
              </span>
              <h2>{feature.title}</h2>
              <p>{feature.body}</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
