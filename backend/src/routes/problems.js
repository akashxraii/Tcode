const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const { getProblemDefinition } = require('../problemCatalog');

const router = express.Router();

const fallbackProblems = [
  {
    id: 1,
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['Array', 'Hash Table'],
  },
];

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

router.get('/', async (req, res) => {
  if (!shouldUseDatabase()) {
    return res.json(fallbackProblems);
  }

  try {
    const result = await pool.query(
      'SELECT id, slug, title, difficulty, tags FROM problems ORDER BY id ASC',
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:idOrSlug', async (req, res) => {
  const { idOrSlug } = req.params;

  if (!shouldUseDatabase()) {
    const problem = getProblemDefinition(idOrSlug) || fallbackProblems.find(
      (item) => String(item.id) === idOrSlug || item.slug === idOrSlug,
    );

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    return res.json(problem);
  }

  try {
    const result = await pool.query(
      'SELECT * FROM problems WHERE id::text = $1 OR slug = $1',
      [idOrSlug],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  if (!shouldUseDatabase()) {
    return res.status(503).json({ error: 'DATABASE_URL is required to create problems' });
  }

  const { title, slug, description, difficulty, tags, time_limit, memory_limit } = req.body;

  if (!title || !description || !difficulty) {
    return res.status(400).json({ error: 'Title, description and difficulty are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO problems (title, slug, description, difficulty, tags, time_limit, memory_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, slug, description, difficulty, tags, time_limit || 1000, memory_limit || 128],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/testcases', auth, async (req, res) => {
  if (!shouldUseDatabase()) {
    return res.status(503).json({ error: 'DATABASE_URL is required to create test cases' });
  }

  const { testcases } = req.body;

  if (!testcases || !Array.isArray(testcases)) {
    return res.status(400).json({ error: 'testcases must be an array' });
  }

  try {
    const inserted = [];

    for (const tc of testcases) {
      const result = await pool.query(
        `INSERT INTO test_cases (problem_id, input, expected_output, is_sample)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.params.id, tc.input, tc.expected_output, tc.is_sample || false],
      );
      inserted.push(result.rows[0]);
    }

    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/testcases', async (req, res) => {
  if (!shouldUseDatabase()) {
    return res.status(503).json({ error: 'DATABASE_URL is required to read database test cases' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM test_cases WHERE problem_id = $1 AND is_sample = true',
      [req.params.id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
