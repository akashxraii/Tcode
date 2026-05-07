const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const LANGUAGE_CONFIG = {
  python: {
    image: 'python:3.11-slim',
    filename: 'solution.py',
    runCmd: 'python solution.py',
  },
  javascript: {
    image: 'node:20-slim',
    filename: 'solution.js',
    runCmd: 'node solution.js',
  },
  java: {
    image: 'eclipse-temurin:17-jdk-jammy',
    filename: 'Main.java',
    runCmd: 'javac Main.java && java Main',
  },
}

function wrapPython(code, input) {
  return `
${code}

def __parse_input(raw):
    lines = [line.strip() for line in raw.strip().split("\\n") if line.strip()]
    first = lines[0].split("=", 1)[-1].strip()
    second = lines[1].split("=", 1)[-1].strip()
    nums = list(map(int, first.strip("[]").split(","))) if first.strip("[]") else []
    target = int(second)
    return nums, target

nums, target = __parse_input(${JSON.stringify(input)})

if "Solution" in globals():
    print(Solution().twoSum(nums, target))
else:
    print(twoSum(nums, target))
`
}

function wrapJavaScript(code, input) {
  return `
${code}

function __parseInput(raw) {
  const lines = raw.trim().split("\\n").map((line) => line.trim()).filter(Boolean);
  const numsRaw = lines[0].includes("=") ? lines[0].split("=").slice(1).join("=").trim() : lines[0];
  const targetRaw = lines[1].includes("=") ? lines[1].split("=").slice(1).join("=").trim() : lines[1];
  return [JSON.parse(numsRaw), Number.parseInt(targetRaw, 10)];
}

const [nums, target] = __parseInput(${JSON.stringify(input)});
const answer = typeof twoSum === "function" ? twoSum(nums, target) : new Solution().twoSum(nums, target);
console.log(JSON.stringify(answer));
`
}

function wrapJava(code, input) {
  const normalizedCode = code.replace(/public\s+class\s+Solution/g, 'class Solution')

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
`
}

function buildFinalCode(language, code, input) {
  if (language === 'python') {
    return wrapPython(code, input)
  }

  if (language === 'javascript') {
    return wrapJavaScript(code, input)
  }

  if (language === 'java') {
    return wrapJava(code, input)
  }

  return code
}

function runCode(language, code, input, timeLimit) {
  if (!timeLimit) timeLimit = 5
  const config = LANGUAGE_CONFIG[language]

  if (!config) {
    return { success: false, error: 'Unsupported language' }
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'technocode-'))

  try {
    const finalCode = buildFinalCode(language, code, input)
    const codeFile = path.join(tmpDir, config.filename)
    fs.writeFileSync(codeFile, finalCode)

    const start = Date.now()
    const output = execFileSync('docker', [
      'run',
      '--rm',
      '--network',
      'none',
      '--memory',
      '128m',
      '--cpus',
      '0.5',
      '--volume',
      `${tmpDir}:/code`,
      '--workdir',
      '/code',
      config.image,
      'sh',
      '-c',
      config.runCmd,
    ], {
      timeout: timeLimit * 1000,
      encoding: 'utf8',
    })

    const runtime = Date.now() - start

    return {
      success: true,
      output: output.trim(),
      runtime: runtime,
    }
  } catch (err) {
    if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      return { success: false, error: 'Time Limit Exceeded' }
    }

    return {
      success: false,
      error: err.stderr ? err.stderr.toString().trim() : err.message || 'Runtime Error',
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

module.exports = { runCode }
