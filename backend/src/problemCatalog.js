const twoSumTests = [
  {
    nums: [2, 7, 11, 15],
    target: 9,
    expected: [0, 1],
    public: true,
  },
  {
    nums: [3, 2, 4],
    target: 6,
    expected: [1, 2],
    public: true,
  },
  {
    nums: [3, 3],
    target: 6,
    expected: [0, 1],
    public: true,
  },
  {
    nums: [0, 4, 3, 0],
    target: 0,
    expected: [0, 3],
    public: false,
  },
  {
    nums: [-1, -2, -3, -4, -5],
    target: -8,
    expected: [2, 4],
    public: false,
  },
];

const problemDefinitions = {
  'two-sum': {
    slug: 'two-sum',
    title: 'Two Sum',
    functionName: 'twoSum',
    tests: twoSumTests,
  },
};

function formatArray(value) {
  return JSON.stringify(value);
}

function toRunnerTest(test, index) {
  return {
    label: `Test Case ${index + 1}`,
    args: [test.nums, test.target],
    input: `nums = ${formatArray(test.nums)}\ntarget = ${test.target}`,
    expected: formatArray(test.expected),
  };
}

function getProblemDefinition(slug) {
  return problemDefinitions[slug] || null;
}

function getProblemTests(slug, mode) {
  const problem = getProblemDefinition(slug);

  if (!problem) {
    return [];
  }

  const selectedTests = mode === 'submit'
    ? problem.tests
    : problem.tests.filter((test) => test.public);

  return selectedTests.map(toRunnerTest);
}

module.exports = {
  getProblemDefinition,
  getProblemTests,
};
