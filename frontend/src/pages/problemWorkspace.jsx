import { useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Link, useParams } from 'react-router-dom';
import { problems } from '../data/problems';
import './problemWorkspace.css';

const languageOptions = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const DEFAULT_SIDEBAR_WIDTH = 340;
const MIN_SIDEBAR_WIDTH = 260;
const MAX_SIDEBAR_WIDTH = 560;
const MIN_EDITOR_WIDTH = 520;
const DEFAULT_TEST_PANEL_HEIGHT = 286;
const MIN_TEST_PANEL_HEIGHT = 52;
const MAX_TEST_PANEL_HEIGHT = 520;
const MIN_EDITOR_HEIGHT = 220;
const fileNames = {
  typescript: 'editor.ts',
  javascript: 'editor.js',
  python: 'solution.py',
  java: 'Solution.java',
};

const fallbackCode =
  'function solve() {\n' +
  '  // Write your solution here\n' +
  '}\n';

function getStarterCode(problem, language) {
  if (typeof problem.starterCode === 'string') {
    return problem.starterCode;
  }

  return problem.starterCode?.[language] || problem.starterCode?.typescript || fallbackCode;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function configureEditorTheme(monaco) {
  monaco.editor.defineTheme('technocode-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'a98dff' },
      { token: 'number', foreground: '8fd3ff' },
      { token: 'string', foreground: 'd7c988' },
      { token: 'comment', foreground: '8a867c', fontStyle: 'italic' },
      { token: 'type', foreground: '8fd3ff' },
    ],
    colors: {
      'editor.background': '#101011',
      'editor.foreground': '#f4f4f0',
      'editor.lineHighlightBackground': '#ffffff08',
      'editorLineNumber.foreground': '#6f6f6f',
      'editorLineNumber.activeForeground': '#e0dcd0',
      'editorCursor.foreground': '#f4f4f0',
      'editor.selectionBackground': '#6d55ff55',
      'editorGutter.background': '#101011',
    },
  });
}

function ProblemWorkspace() {
  const { slug } = useParams();
  const workspaceRef = useRef(null);
  const mainRef = useRef(null);
  const problem = useMemo(
    () => problems.find((item) => item.slug === slug) || problems[0],
    [slug],
  );
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState(getStarterCode(problem, language));
  const [testResults, setTestResults] = useState(problem.testCases || []);
  const [selectedCase, setSelectedCase] = useState(0);
  const [statusText, setStatusText] = useState('Ready');
  const [runError, setRunError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isTestPanelMinimized, setIsTestPanelMinimized] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [testPanelHeight, setTestPanelHeight] = useState(DEFAULT_TEST_PANEL_HEIGHT);

  const activeCase = testResults[selectedCase] || testResults[0];
  const passedCount = testResults.filter((testCase) => testCase.status === 'passed').length;
  const fileName = fileNames[language] || 'editor.txt';

  function getMaxSidebarWidth() {
    if (!workspaceRef.current) {
      return MAX_SIDEBAR_WIDTH;
    }

    const { width } = workspaceRef.current.getBoundingClientRect();
    return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, width - MIN_EDITOR_WIDTH));
  }

  function getMaxTestPanelHeight() {
    if (!mainRef.current) {
      return MAX_TEST_PANEL_HEIGHT;
    }

    const mainRect = mainRef.current.getBoundingClientRect();
    const toolbarHeight =
      mainRef.current.querySelector('.workspace-toolbar')?.getBoundingClientRect().height || 62;
    const statusbarHeight =
      mainRef.current.querySelector('.workspace-statusbar')?.getBoundingClientRect().height || 38;
    const resizerHeight =
      mainRef.current.querySelector('.workspace-row-resizer')?.getBoundingClientRect().height || 8;

    return Math.max(
      MIN_TEST_PANEL_HEIGHT,
      Math.min(
        MAX_TEST_PANEL_HEIGHT,
        mainRect.height - toolbarHeight - statusbarHeight - resizerHeight - MIN_EDITOR_HEIGHT,
      ),
    );
  }

  function startResize(event) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function stopResize(event) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleSidebarResize(event) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !workspaceRef.current) {
      return;
    }

    const workspaceRect = workspaceRef.current.getBoundingClientRect();
    const nextWidth = event.clientX - workspaceRect.left;
    setSidebarWidth(clamp(nextWidth, MIN_SIDEBAR_WIDTH, getMaxSidebarWidth()));
  }

  function handleTestPanelResize(event) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !mainRef.current) {
      return;
    }

    const mainRect = mainRef.current.getBoundingClientRect();
    const statusbarHeight =
      mainRef.current.querySelector('.workspace-statusbar')?.getBoundingClientRect().height || 38;
    const nextHeight = mainRect.bottom - statusbarHeight - event.clientY;

    setIsTestPanelMinimized(false);
    setTestPanelHeight(clamp(nextHeight, MIN_TEST_PANEL_HEIGHT, getMaxTestPanelHeight()));
  }

  function handleSidebarResizeKeyDown(event) {
    const step = event.shiftKey ? 40 : 16;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      setSidebarWidth((currentWidth) =>
        clamp(
          currentWidth + (event.key === 'ArrowRight' ? step : -step),
          MIN_SIDEBAR_WIDTH,
          getMaxSidebarWidth(),
        ),
      );
    }
  }

  function handleTestPanelResizeKeyDown(event) {
    const step = event.shiftKey ? 40 : 16;

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      setIsTestPanelMinimized(false);
      setTestPanelHeight((currentHeight) =>
        clamp(
          currentHeight + (event.key === 'ArrowUp' ? step : -step),
          MIN_TEST_PANEL_HEIGHT,
          getMaxTestPanelHeight(),
        ),
      );
    }
  }

  function handleLanguageChange(event) {
    const nextLanguage = event.target.value;
    setLanguage(nextLanguage);
    setCode(getStarterCode(problem, nextLanguage));
    setRunError('');
    setStatusText('Ready');
    setTestResults(problem.testCases || []);
    setSelectedCase(0);
  }

  async function executeCode(mode) {
    setIsRunning(true);
    setRunError('');
    setStatusText(mode === 'submit' ? 'Submitting...' : 'Running...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problemSlug: problem.slug,
          language,
          code,
          mode,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Code execution failed');
      }

      const results = payload.results || [];
      setTestResults(results);
      setSelectedCase(0);

      if (payload.error) {
        setRunError(payload.error);
        setStatusText('Execution error');
        return;
      }

      setStatusText(`${payload.passed}/${payload.total} passed in ${payload.runtime}ms`);
    } catch (error) {
      setRunError(error.message);
      setStatusText('Runner unavailable');
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main
      className="workspace-page"
      ref={workspaceRef}
      style={{
        '--question-panel-width': `${sidebarWidth}px`,
        '--test-panel-height': `${
          isTestPanelMinimized ? MIN_TEST_PANEL_HEIGHT : testPanelHeight
        }px`,
      }}
    >
      <aside className="workspace-sidebar">
        <section className="workspace-problem">
          <div className="workspace-problem-head">
            <Link className="workspace-back-link" to="/problems" aria-label="Back to problems">
              <span aria-hidden="true">&lt;-</span>
            </Link>
            <p className="workspace-problem-id">{problem.id}</p>
          </div>
          <h1>{problem.title}</h1>

          <div className="workspace-tags">
            <span className={`difficulty difficulty-${problem.difficulty.toLowerCase()}`}>
              {problem.difficulty}
            </span>
            {problem.topics.map((topic) => (
              <span key={topic}>{topic}</span>
            ))}
          </div>

          <div className="workspace-description">
            {problem.description?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <section className="workspace-example" aria-labelledby="example-title">
            <h2 id="example-title">Example 1</h2>
            {problem.examples?.map((example) => (
              <div className="example-box" key={example.input}>
                <p>
                  <span>Input:</span> {example.input}
                </p>
                <p>
                  <span>Output:</span> {example.output}
                </p>
                <p>
                  <span>Explanation:</span> {example.explanation}
                </p>
              </div>
            ))}
          </section>
        </section>
      </aside>

      <div
        className="workspace-column-resizer"
        role="separator"
        aria-label="Resize question panel"
        aria-orientation="vertical"
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={MAX_SIDEBAR_WIDTH}
        aria-valuenow={Math.round(sidebarWidth)}
        tabIndex={0}
        onPointerDown={startResize}
        onPointerMove={handleSidebarResize}
        onPointerUp={stopResize}
        onPointerCancel={stopResize}
        onDoubleClick={() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH)}
        onKeyDown={handleSidebarResizeKeyDown}
      />

      <section className="workspace-main" ref={mainRef} aria-label={`${problem.title} editor`}>
        <header className="workspace-toolbar">
          <div className="file-tab">
            <span aria-hidden="true">&lt;&gt;</span>
            <span>{fileName}</span>
          </div>

          <div className="workspace-actions">
            <label className="language-select">
              <span className="sr-only">Language</span>
              <select value={language} onChange={handleLanguageChange}>
                {languageOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="run-button"
              disabled={isRunning}
              onClick={() => executeCode('run')}
            >
              <span aria-hidden="true"></span>
              {isRunning ? 'Running' : 'Run'}
            </button>
            <button
              type="button"
              className="submit-button"
              disabled={isRunning}
              onClick={() => executeCode('submit')}
            >
              Submit
            </button>
          </div>
        </header>

        <div className="editor-region">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme="technocode-dark"
            beforeMount={configureEditorTheme}
            onChange={(value) => setCode(value || '')}
            options={{
              automaticLayout: true,
              fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
              fontSize: 15,
              lineHeight: 26,
              minimap: { enabled: false },
              overviewRulerLanes: 0,
              padding: { top: 24, bottom: 24 },
              renderLineHighlight: 'gutter',
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              wordWrap: 'on',
            }}
          />
        </div>

        <div
          className="workspace-row-resizer"
          role="separator"
          aria-label="Resize test cases panel"
          aria-orientation="horizontal"
          aria-valuemin={MIN_TEST_PANEL_HEIGHT}
          aria-valuemax={MAX_TEST_PANEL_HEIGHT}
          aria-valuenow={Math.round(isTestPanelMinimized ? MIN_TEST_PANEL_HEIGHT : testPanelHeight)}
          tabIndex={0}
          onPointerDown={startResize}
          onPointerMove={handleTestPanelResize}
          onPointerUp={stopResize}
          onPointerCancel={stopResize}
          onDoubleClick={() => {
            setIsTestPanelMinimized(false);
            setTestPanelHeight(DEFAULT_TEST_PANEL_HEIGHT);
          }}
          onKeyDown={handleTestPanelResizeKeyDown}
        />

        <section
          className={isTestPanelMinimized ? 'test-panel test-panel-minimized' : 'test-panel'}
          aria-label="Test cases"
        >
          <div className="test-tabs">
            {testResults.map((testCase, index) => (
              <button
                className={index === selectedCase ? 'test-tab active-test' : 'test-tab'}
                type="button"
                key={testCase.label}
                onClick={() => setSelectedCase(index)}
              >
                {testCase.label}
                <span className={`case-status case-${testCase.status}`} aria-hidden="true"></span>
              </button>
            ))}
            <button
              className="test-panel-toggle"
              type="button"
              aria-expanded={!isTestPanelMinimized}
              aria-label={isTestPanelMinimized ? 'Expand test output' : 'Minimize test output'}
              onClick={() => setIsTestPanelMinimized((current) => !current)}
            >
              {isTestPanelMinimized ? 'Expand' : 'Minimize'}
            </button>
          </div>

          {!isTestPanelMinimized && runError && (
            <div className="runner-error" role="alert">
              {runError}
            </div>
          )}

          {!isTestPanelMinimized && activeCase && (
            <div className="test-grid">
              <div className="test-block">
                <h3>Input</h3>
                <pre>{activeCase.input}</pre>
              </div>
              <div className="test-block">
                <h3>Expected Output</h3>
                <pre>{activeCase.expected}</pre>
              </div>
              <div className={`test-block actual-output case-${activeCase.status}`}>
                <h3>Actual Output</h3>
                <pre>{activeCase.actual}</pre>
              </div>
            </div>
          )}
        </section>

        <footer className="workspace-statusbar">
          <span>&lt;&gt; LN 1, COL 1</span>
          <span>UTF-8</span>
          <span>{language.toUpperCase()}</span>
          <span>
            {passedCount}/{testResults.length} passed
          </span>
          <span>{statusText}</span>
        </footer>
      </section>
    </main>
  );
}

export default ProblemWorkspace;
