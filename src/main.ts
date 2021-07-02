import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    // const githubToken: string = core.getInput('githubToken')
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.info(payload)
    // console.log(`The event payload: ${payload}`);
    // core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
