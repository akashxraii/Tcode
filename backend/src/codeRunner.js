const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');

const RUNNER_TIMEOUT_MS = 3000;
const SETUP_TIMEOUT_MS = 1000;
const TEST_TIMEOUT_MS = 500;
const DOCKER_TEST_TIMEOUT_MS = 7000;
const DOCKER_CONFIG = {
  python: {
    image: 'python:3.11-slim',
    filename: 'solution.py',
    runCmd: 'python solution.py',
  },
  java: {
    image: 'eclipse-temurin:17-jdk-jammy',
    filename: 'Main.java',
    runCmd: 'javac Main.java && java Main',
  },
};

function compileSubmission(code, language) {
  if (language === 'javascript' || language === 'python' || language === 'java') {
    return { code };
  }

  if (language !== 'typescript') {
    return {
      error: `${language} execution is not supported yet.`,
    };
  }

  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      strict: false,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });

  const errors = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );

  if (errors.length > 0) {
    return {
      error: errors
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
        .join('\n'),
    };
  }

  return { code: result.outputText };
}

function parseActualArray(output) {
  const normalized = String(output || '').trim().replace(/\s+/g, '');

  try {
    const parsed = JSON.parse(normalized);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function validateTwoSumOutput(output, test) {
  const actual = parseActualArray(output);

  if (!actual || actual.length !== 2) {
    return false;
  }

  const [leftIndex, rightIndex] = actual;
  const [nums, target] = test.args;

  if (!Number.isInteger(leftIndex) || !Number.isInteger(rightIndex)) {
    return false;
  }

  if (leftIndex === rightIndex) {
    return false;
  }

  if (leftIndex < 0 || rightIndex < 0 || leftIndex >= nums.length || rightIndex >= nums.length) {
    return false;
  }

  return nums[leftIndex] + nums[rightIndex] === target;
}

function wrapPython(code, input) {
  return `
${code}

def __parse_input(raw):
    lines = [line.strip() for line in raw.strip().split("\\n") if line.strip()]
    nums_raw = lines[0].split("=", 1)[-1].strip()
    target_raw = lines[1].split("=", 1)[-1].strip()
    nums = list(map(int, nums_raw.strip("[]").split(","))) if nums_raw.strip("[]") else []
    return nums, int(target_raw)

nums, target = __parse_input(${JSON.stringify(input)})

if "Solution" in globals():
    print(Solution().twoSum(nums, target))
else:
    print(twoSum(nums, target))
`;
}

function wrapJava(code, input) {
  const normalizedCode = code.replace(/public\s+class\s+Solution/g, 'class Solution');

  return `
import java.util.*;

${normalizedCode}

class Main {
  private static String valueAfterEquals(String line) {
    int index = line.indexOf('=');
    return index >= 0 ? line.substring(index + 1).trim() : line.trim();
  }

  private static int[] parseNums(String line) {
    String raw = valueAfterEquals(line).replace("[", "").replace("]", "").trim();
    if (raw.isEmpty()) {
      return new int[0];
    }

    String[] parts = raw.split(",");
    int[] nums = new int[parts.length];
    for (int i = 0; i < parts.length; i++) {
      nums[i] = Integer.parseInt(parts[i].trim());
    }
    return nums;
  }

  public static void main(String[] args) {
    String[] lines = ${JSON.stringify(input)}.trim().split("\\\\n");
    int[] nums = parseNums(lines[0]);
    int target = Integer.parseInt(valueAfterEquals(lines[1]));
    int[] answer = new Solution().twoSum(nums, target);
    System.out.println(Arrays.toString(answer).replace(" ", ""));
  }
}
`;
}

function buildDockerCode(language, code, input) {
  if (language === 'python') {
    return wrapPython(code, input);
  }

  if (language === 'java') {
    return wrapJava(code, input);
  }

  return code;
}

function runDockerCommand(args, cwd) {
  return new Promise((resolve) => {
    const child = spawn('docker', args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, DOCKER_TEST_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ success: false, error: error.message, output: '' });
    });

    child.on('close', (code) => {
      clearTimeout(timer);

      if (timedOut) {
        resolve({ success: false, error: 'Time Limit Exceeded', output: '' });
        return;
      }

      if (code !== 0) {
        resolve({ success: false, error: stderr.trim() || 'Runtime Error', output: stdout.trim() });
        return;
      }

      resolve({ success: true, error: null, output: stdout.trim() });
    });
  });
}

async function runDockerTest({ language, code, test }) {
  const config = DOCKER_CONFIG[language];
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'technocode-docker-'));
  const codePath = path.join(tempDir, config.filename);

  try {
    await fs.writeFile(codePath, buildDockerCode(language, code, test.input), 'utf8');
    const startedAt = Date.now();
    const result = await runDockerCommand([
      'run',
      '--rm',
      '--network',
      'none',
      '--memory',
      '128m',
      '--cpus',
      '0.5',
      '--volume',
      `${tempDir}:/code`,
      '--workdir',
      '/code',
      config.image,
      'sh',
      '-c',
      config.runCmd,
    ], tempDir);
    const runtime = Date.now() - startedAt;

    return {
      ...result,
      runtime,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function executeInDocker({ code, language, problemSlug, tests }) {
  const results = [];
  const logs = [];

  for (const test of tests) {
    const result = await runDockerTest({ language, code, test });

    if (!result.success) {
      results.push({
        label: test.label,
        status: 'failed',
        input: test.input,
        expected: test.expected,
        actual: result.output || '',
        error: result.error,
      });
      continue;
    }

    const passed = problemSlug === 'two-sum'
      ? validateTwoSumOutput(result.output, test)
      : result.output.trim() === test.expected;

    results.push({
      label: test.label,
      status: passed ? 'passed' : 'failed',
      input: test.input,
      expected: test.expected,
      actual: result.output,
      error: null,
    });
  }

  return {
    results,
    logs,
    error: null,
  };
}

function buildRunnerSource(payload) {
  return `
const vm = require('node:vm');
const payload = ${JSON.stringify(payload)};
const logs = [];

function formatError(error) {
  if (!error) {
    return 'Unknown error';
  }

  return error && error.message ? error.message : String(error);
}

function normalizeValue(value) {
  if (typeof value === 'undefined') {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function formatActual(value) {
  if (typeof value === 'undefined') {
    return 'undefined';
  }

  const normalized = normalizeValue(value);

  if (typeof normalized === 'string') {
    return normalized;
  }

  return JSON.stringify(normalized);
}

function validateTwoSum(actual, test) {
  const normalized = normalizeValue(actual);

  if (!Array.isArray(normalized) || normalized.length !== 2) {
    return false;
  }

  const [leftIndex, rightIndex] = normalized;
  const [nums, target] = test.args;

  if (!Number.isInteger(leftIndex) || !Number.isInteger(rightIndex)) {
    return false;
  }

  if (leftIndex === rightIndex) {
    return false;
  }

  if (leftIndex < 0 || rightIndex < 0 || leftIndex >= nums.length || rightIndex >= nums.length) {
    return false;
  }

  return nums[leftIndex] + nums[rightIndex] === target;
}

function validate(actual, test) {
  if (payload.problemSlug === 'two-sum') {
    return validateTwoSum(actual, test);
  }

  return JSON.stringify(normalizeValue(actual)) === test.expected;
}

const sandbox = {
  Array,
  Boolean,
  Date,
  Error,
  JSON,
  Map,
  Math,
  Number,
  Object,
  RangeError,
  RegExp,
  Set,
  String,
  SyntaxError,
  TypeError,
  WeakMap,
  WeakSet,
  console: {
    log: (...args) => logs.push(args.map((item) => String(item)).join(' ')),
  },
};

sandbox.globalThis = sandbox;
sandbox.module = { exports: {} };
sandbox.exports = sandbox.module.exports;

const context = vm.createContext(sandbox, { name: 'technocode-submission' });

try {
  new vm.Script(payload.code, { filename: 'submission.js' }).runInContext(context, {
    timeout: ${SETUP_TIMEOUT_MS},
  });

  new vm.Script(
    'this.__solution = typeof ' + payload.functionName + ' === "function" ? ' +
      payload.functionName +
      ' : module.exports.' +
      payload.functionName +
      ' || exports.' +
      payload.functionName +
      ' || module.exports.default;'
  ).runInContext(context, { timeout: 50 });

  if (typeof context.__solution !== 'function') {
    throw new Error('Expected a function named ' + payload.functionName + '.');
  }

  const results = payload.tests.map((test) => {
    try {
      context.__args = test.args;
      context.__actual = undefined;

      new vm.Script('this.__actual = __solution(...__args);').runInContext(context, {
        timeout: ${TEST_TIMEOUT_MS},
      });

      const actual = normalizeValue(context.__actual);
      const passed = validate(actual, test);

      return {
        label: test.label,
        status: passed ? 'passed' : 'failed',
        input: test.input,
        expected: test.expected,
        actual: formatActual(actual),
        error: null,
      };
    } catch (error) {
      return {
        label: test.label,
        status: 'failed',
        input: test.input,
        expected: test.expected,
        actual: '',
        error: formatError(error),
      };
    }
  });

  process.stdout.write(JSON.stringify({
    results,
    logs: logs.slice(-20),
    error: null,
  }));
} catch (error) {
  process.stdout.write(JSON.stringify({
    results: [],
    logs: logs.slice(-20),
    error: formatError(error),
  }));
}
`;
}

async function executeInChild(payload) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'technocode-runner-'));
  const runnerPath = path.join(tempDir, 'runner.js');

  try {
    await fs.writeFile(runnerPath, buildRunnerSource(payload), 'utf8');

    return await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [runnerPath], {
        cwd: tempDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, RUNNER_TIMEOUT_MS);

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });

      child.on('close', () => {
        clearTimeout(timer);

        if (timedOut) {
          resolve({
            results: [],
            logs: [],
            error: 'Execution timed out.',
          });
          return;
        }

        if (!stdout.trim()) {
          resolve({
            results: [],
            logs: [],
            error: stderr.trim() || 'Runner produced no output.',
          });
          return;
        }

        try {
          resolve(JSON.parse(stdout));
        } catch {
          resolve({
            results: [],
            logs: [],
            error: 'Runner returned invalid output.',
          });
        }
      });
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function runCode({ code, language, problemSlug, functionName, tests }) {
  const compiled = compileSubmission(code, language);

  if (compiled.error) {
    return {
      results: [],
      logs: [],
      error: compiled.error,
    };
  }

  if (DOCKER_CONFIG[language]) {
    return executeInDocker({
      code: compiled.code,
      language,
      problemSlug,
      tests,
    });
  }

  return executeInChild({
    code: compiled.code,
    functionName,
    problemSlug,
    tests,
  });
}

module.exports = {
  runCode,
};
