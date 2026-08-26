import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logoMark}></div>
          <span>DocIntel</span>
        </div>
        <nav className={styles.nav}>
          <Link href="/login" className="btn btn-ghost">Log in</Link>
          <Link href="/register" className="btn btn-primary">Get Started</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={`${styles.badge} animate-fade-in-up delay-100`}>
            <span>New</span> Advanced AI Analysis Engine 2.0
          </div>
          
          <h1 className="animate-fade-in-up delay-200">
            Understand your documents<br />
            <span className={styles.highlight}>at the speed of thought.</span>
          </h1>
          
          <p className="animate-fade-in-up delay-300">
            Upload PDFs, extract intelligence, and chat directly with your documents. 
            Experience the next generation of knowledge retrieval.
          </p>
          
          <div className={`${styles.actions} animate-fade-in-up delay-300`}>
            <Link href="/register" className={`btn btn-primary ${styles.heroBtn}`}>
              Start for free
            </Link>
            <Link href="/login" className={`btn btn-secondary ${styles.heroBtn}`}>
              Sign in
            </Link>
          </div>
        </div>

        <div className={`${styles.showcase} animate-fade-in-up delay-300`}>
          <div className={`${styles.glassPanel} glass-card`}>
            <div className={styles.panelHeader}>
              <div className={styles.dotGroup}>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
              </div>
              <div className={styles.panelTitle}>AI Analysis Output</div>
            </div>
            <div className={styles.panelContent}>
              <div className="skeleton" style={{ height: '20px', width: '80%', marginBottom: '1rem' }}></div>
              <div className="skeleton" style={{ height: '20px', width: '90%', marginBottom: '1rem' }}></div>
              <div className="skeleton" style={{ height: '20px', width: '60%' }}></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
