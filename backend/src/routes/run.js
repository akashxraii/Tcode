const express = require('express');
const { runCode } = require('../codeRunner');
const { getProblemDefinition, getProblemTests } = require('../problemCatalog');

const router = express.Router();
const supportedLanguages = ['typescript', 'javascript', 'python', 'java'];
const MAX_CODE_LENGTH = 20000;

router.get('/', (req, res) => {
  res.json({
    message: 'Code runner is ready. Send POST requests to this endpoint to execute code.',
    method: 'POST',
    supportedLanguages,
    requiredBody: ['problemSlug', 'language', 'code'],
    optionalBody: {
      mode: ['run', 'submit'],
    },
  });
});

router.post('/', async (req, res) => {
  const {
    problemSlug,
    language = 'typescript',
    code,
    mode = 'run',
  } = req.body;

  if (!problemSlug || !code) {
    return res.status(400).json({ error: 'problemSlug and code are required' });
  }

  if (typeof code !== 'string' || code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({ error: `Code must be under ${MAX_CODE_LENGTH} characters` });
  }

  if (!supportedLanguages.includes(language)) {
    return res.status(400).json({ error: 'Supported languages: typescript, javascript' });
  }

  const problem = getProblemDefinition(problemSlug);

  if (!problem) {
    return res.status(404).json({ error: 'Problem not found' });
  }

  const tests = getProblemTests(problemSlug, mode === 'submit' ? 'submit' : 'run');

  if (tests.length === 0) {
    return res.status(400).json({ error: 'No test cases found for this problem' });
  }

  try {
    const startedAt = Date.now();
    const result = await runCode({
      code,
      language,
      problemSlug,
      functionName: problem.functionName,
      tests,
    });
    const runtime = Date.now() - startedAt;
    const passed = result.results.filter((testCase) => testCase.status === 'passed').length;

    res.json({
      status: result.error ? 'error' : passed === tests.length ? 'accepted' : 'wrong_answer',
      passed,
      total: tests.length,
      runtime,
      results: result.results,
      logs: result.logs,
      error: result.error,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
