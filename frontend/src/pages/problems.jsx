import { Link } from 'react-router-dom';
import { problems } from '../data/problems';
import './problems.css';

const topics = ['Arrays', 'Strings', 'Dynamic Programming', 'Graphs', 'Trees'];

function Problems() {
  return (
    <main className="problems-page">
      <div className="problems-shell">
        <aside className="problems-sidebar" aria-label="Problem highlights">
          <section className="daily-card">
            <p className="daily-eyebrow">Daily Challenge</p>
            <h2>Decode Ways</h2>
            <p>
              Master dynamic programming with today's selected problem and keep
              your streak alive.
            </p>
            <div className="daily-meta">
              <span className="difficulty difficulty-hard">Hard</span>
              <span>24.5% Acceptance</span>
            </div>
            <Link className="solve-link" to="/problems/two-sum">
              Solve Now
              <span aria-hidden="true">-&gt;</span>
            </Link>
          </section>

          <section className="topic-panel" aria-labelledby="featured-topics">
            <h2 id="featured-topics">Featured Topics</h2>
            <div className="topic-list">
              {topics.map((topic) => (
                <button className="topic-chip" type="button" key={topic}>
                  {topic}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="problem-library" aria-labelledby="problem-title">
          <div className="library-header">
            <div>
              <p className="section-kicker">Practice Library</p>
              <h1 id="problem-title">Problem Library</h1>
            </div>

            <div className="problem-tools">
              <label className="problem-search">
                <span className="search-icon" aria-hidden="true"></span>
                <span className="sr-only">Search problems</span>
                <input type="search" placeholder="Search problems..." />
              </label>
              <button className="filter-button" type="button" aria-label="Filter problems">
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>

          <div className="problem-list">
            {problems.map((problem) => (
              <Link className="problem-row" to={`/problems/${problem.slug}`} key={problem.id}>
                <div className="problem-main">
                  <span className="problem-id">{problem.id}</span>
                  <div>
                    <h2>{problem.title}</h2>
                    <div className="problem-meta">
                      <span
                        className={`difficulty difficulty-${problem.difficulty.toLowerCase()}`}
                      >
                        {problem.difficulty}
                      </span>
                      <span>{problem.acceptance} Acceptance</span>
                    </div>
                  </div>
                </div>

                <div className="problem-topics" aria-label={`${problem.title} topics`}>
                  {problem.topics.map((topic) => (
                    <span key={topic}>{topic}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>

          <nav className="problem-pagination" aria-label="Problem pages">
            <button type="button" aria-label="Previous page">
              &lt;
            </button>
            <button className="active-page" type="button" aria-current="page">
              1
            </button>
            <button type="button">2</button>
            <button type="button">3</button>
            <span>...</span>
            <button type="button" aria-label="Next page">
              &gt;
            </button>
          </nav>
        </section>
      </div>

      <footer className="problems-footer">
        <h2>Technocode</h2>
        <nav aria-label="Footer links">
          <a href="#docs">Documentation</a>
          <a href="#privacy">Privacy</a>
          <a href="#changelog">Changelog</a>
        </nav>
        <p>&copy; 2026 Technocode. Built for the focused mind.</p>
      </footer>
    </main>
  );
}

export default Problems;
