import { useEffect, useRef } from 'react';
import '../App.css';

function Home() {
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.reveal-up');
    elements.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <main className="main-container">
      {/* Hero Section */}
      <section className="page-content hero-section">
        <div className="letters-left">
          <span className="letter letter-1">C++</span>
          <span className="letter letter-2">Python</span>
          <span className="letter letter-3">JS</span>
          <span className="letter letter-4">HTML</span>
        </div>
        <div className="letters-right">
          <span className="letter letter-5">C</span>
          <span className="letter letter-6">Java</span>
          <span className="letter letter-7">DSA</span>
          <span className="letter letter-8">React</span>
        </div>
        <div className="home-text reveal-up">
          <h1 className="hero-title">Learn the <br/> <span className="italic-serif">pattern.</span></h1>
          <p className="hero-subtitle">A new way to understand and master coding. Beautiful, collaborative, and designed for focus.</p>
          <button className="cta-button">Get Started</button>
        </div>
        <div className="vignette-overlay"></div>
      </section>

      {/* Side-by-Side Pinned Section */}
      <section className="pinned-section">
        <div className="pinned-container">
          <div className="sticky-left reveal-up">
            <h2 className="section-title">Master the Interview</h2>
            <p className="section-subtitle">Everything you need to land your dream job at top tech companies, all in one place.</p>
          </div>
          <div className="scrolling-right">
            <div className="feature-card reveal-up">
              <h3>500+ Curated Problems</h3>
              <p>Skip the noise. We've hand-picked the most essential patterns you need to know.</p>
            </div>
            <div className="feature-card reveal-up">
              <h3>AI Mock Interviews</h3>
              <p>Practice with our advanced AI interviewer that adapts to your skill level and gives real-time feedback.</p>
            </div>
            <div className="feature-card reveal-up">
              <h3>Real-time Execution</h3>
              <p>Write, run, and debug your code instantly in a blazingly fast, collaborative editor.</p>
            </div>
            <div className="feature-card reveal-up">
              <h3>Pattern Recognition</h3>
              <p>Don't just memorize solutions. Learn the underlying algorithms and data structure patterns.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Bottom CTA Section */}
      <section className="bottom-cta-section reveal-up">
        <h2>Ready to crack the code?</h2>
        <p>Join thousands of developers landing offers at elite tech companies.</p>
        <button className="cta-button">Start coding for free</button>
      </section>
    </main>
  );
}

export default Home;
