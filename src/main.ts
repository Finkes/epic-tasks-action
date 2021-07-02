import * as core from '@actions/core'
import * as github from '@actions/github'

async function updateEpic(token: string, issue: any, repo: any): Promise<void> {
  core.info('todo update epic')

  const events = await github
    .getOctokit(token)
      .rest.issues.listEventsForTimeline({
        owner: repo.owner.login,
        repo: repo.name,
        issue_number: issue.number as number,
      })

  core.info(JSON.stringify(events.data, undefined, 2))
}

async function run(): Promise<void> {
  try {
    const githubToken: string = core.getInput('githubToken')
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.info(payload)

    const issue = github.context.payload.issue
    const repo = github.context.payload.repository
    core.info(issue?.labels)

    if (issue && issue.labels.includes('epic')) {
      await updateEpic(githubToken, issue, repo)
    }
    // if issue is epic -> update epic
    // else if no epic -> find reference to other issues
    // fetch other issues, filter for epics
    // foreach epic -> update epic
    // update Epic:
    // find all references
    // fetch issues
    // render a task list
    // find existing task list & merge (advanced)
    // console.log(`The event payload: ${payload}`);
    // core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
