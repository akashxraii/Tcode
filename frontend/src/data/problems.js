export const problems = [
  {
    id: '001',
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    acceptance: '49.2%',
    topics: ['Array', 'Hash Table'],
    description: [
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      'You may assume that each input would have exactly one solution, and you may not use the same element twice.',
      'You can return the answer in any order.',
    ],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
    ],
    testCases: [
      {
        label: 'Test Case 1',
        status: 'pending',
        input: 'nums = [2,7,11,15]\ntarget = 9',
        expected: '[0,1]',
        actual: 'Run code to see output',
      },
      {
        label: 'Test Case 2',
        status: 'pending',
        input: 'nums = [3,2,4]\ntarget = 6',
        expected: '[1,2]',
        actual: 'Run code to see output',
      },
      {
        label: 'Test Case 3',
        status: 'pending',
        input: 'nums = [3,3]\ntarget = 6',
        expected: '[0,1]',
        actual: 'Run code to see output',
      },
    ],
    starterCode: {
      typescript:
        'function twoSum(nums: number[], target: number): number[] {\n' +
        '  const map = new Map<number, number>();\n\n' +
        '  for (let i = 0; i < nums.length; i++) {\n' +
        '    const complement = target - nums[i];\n\n' +
        '    if (map.has(complement)) {\n' +
        '      return [map.get(complement)!, i];\n' +
        '    }\n\n' +
        '    map.set(nums[i], i);\n' +
        '  }\n\n' +
        '  return [];\n' +
        '}',
      javascript:
        'function twoSum(nums, target) {\n' +
        '  const map = new Map();\n\n' +
        '  for (let i = 0; i < nums.length; i++) {\n' +
        '    const complement = target - nums[i];\n\n' +
        '    if (map.has(complement)) {\n' +
        '      return [map.get(complement), i];\n' +
        '    }\n\n' +
        '    map.set(nums[i], i);\n' +
        '  }\n\n' +
        '  return [];\n' +
        '}',
      python:
        'class Solution:\n' +
        '    def twoSum(self, nums, target):\n' +
        '        seen = {}\n\n' +
        '        for i, value in enumerate(nums):\n' +
        '            complement = target - value\n\n' +
        '            if complement in seen:\n' +
        '                return [seen[complement], i]\n\n' +
        '            seen[value] = i\n\n' +
        '        return []\n',
      java:
        'class Solution {\n' +
        '  public int[] twoSum(int[] nums, int target) {\n' +
        '    Map<Integer, Integer> seen = new HashMap<>();\n\n' +
        '    for (int i = 0; i < nums.length; i++) {\n' +
        '      int complement = target - nums[i];\n\n' +
        '      if (seen.containsKey(complement)) {\n' +
        '        return new int[] { seen.get(complement), i };\n' +
        '      }\n\n' +
        '      seen.put(nums[i], i);\n' +
        '    }\n\n' +
        '    return new int[] {};\n' +
        '  }\n' +
        '}',
    },
  },
  {
    id: '015',
    slug: '3sum',
    title: '3Sum',
    difficulty: 'Medium',
    acceptance: '32.8%',
    topics: ['Array', 'Two Pointers'],
  },
  {
    id: '042',
    slug: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    acceptance: '59.1%',
    topics: ['Stack', 'Dynamic Programming'],
  },
  {
    id: '072',
    slug: 'edit-distance',
    title: 'Edit Distance',
    difficulty: 'Hard',
    acceptance: '53.4%',
    topics: ['String', 'Dynamic Programming'],
  },
  {
    id: '206',
    slug: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    acceptance: '76.4%',
    topics: ['Linked List', 'Recursion'],
  },
  {
    id: '121',
    slug: 'best-time-to-buy-and-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    acceptance: '54.8%',
    topics: ['Array', 'Dynamic Programming'],
  },
  {
    id: '200',
    slug: 'number-of-islands',
    title: 'Number of Islands',
    difficulty: 'Medium',
    acceptance: '60.9%',
    topics: ['Graph', 'DFS'],
  },
  {
    id: '238',
    slug: 'product-of-array-except-self',
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    acceptance: '66.1%',
    topics: ['Array', 'Prefix Sum'],
  },
  {
    id: '297',
    slug: 'serialize-and-deserialize-binary-tree',
    title: 'Serialize and Deserialize Binary Tree',
    difficulty: 'Hard',
    acceptance: '58.3%',
    topics: ['Tree', 'BFS'],
  },
  {
    id: '322',
    slug: 'coin-change',
    title: 'Coin Change',
    difficulty: 'Medium',
    acceptance: '46.7%',
    topics: ['Dynamic Programming', 'BFS'],
  },
];
