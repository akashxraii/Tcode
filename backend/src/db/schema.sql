CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS problems (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(120) UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(10) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[],
  time_limit INTEGER DEFAULT 1000,
  memory_limit INTEGER DEFAULT 128,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_cases (
  id SERIAL PRIMARY KEY,
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  language VARCHAR(20) NOT NULL,
  code TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  runtime INTEGER,
  memory INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO problems (slug, title, description, difficulty, tags)
VALUES (
  'two-sum',
  'Two Sum',
  'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
  'easy',
  ARRAY['Array', 'Hash Table']
)
ON CONFLICT (slug) DO NOTHING;

WITH two_sum AS (
  SELECT id FROM problems WHERE slug = 'two-sum'
)
INSERT INTO test_cases (problem_id, input, expected_output, is_sample)
SELECT two_sum.id, seed.input, seed.expected_output, seed.is_sample
FROM two_sum
CROSS JOIN (
  VALUES
    ('nums = [2,7,11,15]' || E'\n' || 'target = 9', '[0,1]', true),
    ('nums = [3,2,4]' || E'\n' || 'target = 6', '[1,2]', true),
    ('nums = [3,3]' || E'\n' || 'target = 6', '[0,1]', true),
    ('nums = [0,4,3,0]' || E'\n' || 'target = 0', '[0,3]', false),
    ('nums = [-1,-2,-3,-4,-5]' || E'\n' || 'target = -8', '[2,4]', false)
) AS seed(input, expected_output, is_sample)
WHERE NOT EXISTS (
  SELECT 1
  FROM test_cases
  WHERE test_cases.problem_id = two_sum.id
    AND test_cases.input = seed.input
);
