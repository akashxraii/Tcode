const { Worker } = require('bullmq')
const { runCode } = require('./runner')
const { Pool } = require('pg')
require('dotenv').config()

const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

function normalize(str) {
  return String(str || '').trim().replace(/\s+/g, '').toLowerCase()
}

const worker = new Worker(
  'submissions',
  async (job) => {
    const { submissionId, language, code, testCases } = job.data

    console.log(`Processing submission ${submissionId}...`)

    try {
      await pool.query(
        'UPDATE submissions SET status = $1 WHERE id = $2',
        ['running', submissionId]
      )

      let totalRuntime = 0
      let verdict = 'accepted'

      for (const tc of testCases) {
        const result = runCode(language, code, tc.input)

        if (!result.success) {
          verdict = result.error === 'Time Limit Exceeded' ? 'tle' : 'runtime_error'
          break
        }

        totalRuntime += result.runtime

        console.log('Output:', JSON.stringify(result.output))
        console.log('Expected:', JSON.stringify(tc.expected_output.trim()))

        if (normalize(result.output) !== normalize(tc.expected_output)) {
          verdict = 'wrong_answer'
          break
        }
      }

      await pool.query(
        'UPDATE submissions SET status = $1, runtime = $2 WHERE id = $3',
        [verdict, totalRuntime, submissionId]
      )

      console.log(`Submission ${submissionId} -> ${verdict}`)
    } catch (err) {
      await pool.query(
        'UPDATE submissions SET status = $1 WHERE id = $2',
        ['runtime_error', submissionId]
      )
      throw err
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
)

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message)
})

console.log('Worker is running and waiting for jobs...')
