const express = require('express');
const { Queue } = require('bullmq');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
const supportedLanguages = ['python', 'javascript', 'java'];
const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
};
let submissionQueue;

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function getSubmissionQueue() {
  if (!submissionQueue) {
    submissionQueue = new Queue('submissions', { connection: redisConnection });
  }

  return submissionQueue;
}

router.post('/', auth, async (req, res) => {
  if (!shouldUseDatabase()) {
    return res.status(503).json({ error: 'DATABASE_URL is required to save submissions' });
  }

  const { problem_id, language, code } = req.body;

  if (!problem_id || !language || !code) {
    return res.status(400).json({ error: 'problem_id, language and code are required' });
  }

  if (!supportedLanguages.includes(language)) {
    return res.status(400).json({ error: 'Supported languages: python, javascript, java' });
  }

  try {
    const testCases = await pool.query(
      'SELECT input, expected_output FROM test_cases WHERE problem_id = $1 ORDER BY id ASC',
      [problem_id],
    );

    if (testCases.rows.length === 0) {
      return res.status(400).json({ error: 'No test cases found for this problem' });
    }

    const result = await pool.query(
      `INSERT INTO submissions (user_id, problem_id, language, code, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, problem_id, language, code, 'pending'],
    );

    const submission = result.rows[0];

    try {
      await getSubmissionQueue().add(
        'judge',
        {
          submissionId: submission.id,
          language,
          code,
          testCases: testCases.rows,
        },
        {
          attempts: 1,
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      );
    } catch (queueErr) {
      await pool.query(
        'UPDATE submissions SET status = $1 WHERE id = $2',
        ['queue_error', submission.id],
      );
      console.error(queueErr);
      return res.status(503).json({ error: 'Submission queue is unavailable' });
    }

    res.status(201).json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my', auth, async (req, res) => {
  if (!shouldUseDatabase()) {
    return res.status(503).json({ error: 'DATABASE_URL is required to read submissions' });
  }

  try {
    const result = await pool.query(
      `SELECT s.id, s.problem_id, p.title, s.language, s.status, s.runtime, s.created_at
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  if (!shouldUseDatabase()) {
    return res.status(503).json({ error: 'DATABASE_URL is required to read submissions' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM submissions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
