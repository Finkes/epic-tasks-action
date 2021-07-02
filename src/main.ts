import * as core from '@actions/core'
import * as github from '@actions/github'
import {wait} from "./wait";

async function updateEpic(token: string, issue: any, repo: any): Promise<void> {
    core.info(`updating task list for epic #${issue.number} (${issue.title})`)
    const octo = github.getOctokit(token)

    const events = await octo
        .rest.issues.listEventsForTimeline({
            owner: repo.owner.login,
            repo: repo.name,
            issue_number: issue.number as number,
        })

    const crossRefEvents = events.data.filter((event) => event.event === "cross-referenced" && event.source?.type === "issue")
    const list = crossRefEvents.map((event) => `- [${(event.source?.issue?.state !== "open" ? "x" : " ")}] ${event.source?.issue?.title} ([#${event.source?.issue?.number}](${event.source?.issue?.html_url}))`)

    core.info(JSON.stringify(events.data, undefined, 2))

    const taskListString = list.join('\n')

    core.info(taskListString)

    const newBody = `### Linked Issues\n${taskListString}`

    await octo.rest.issues.update({
        owner: repo.owner.login,
        repo: repo.name,
        issue_number: issue.number as number,
        body: newBody,
    })
}

async function updateNonEpic(token: string, issue: any, repo: any): Promise<void> {
    core.info("update non epic")
    const octo = github.getOctokit(token)

    const events = await octo
        .rest.issues.listEventsForTimeline({
            owner: repo.owner.login,
            repo: repo.name,
            issue_number: issue.number as number,
        })
    core.info(JSON.stringify(events.data, undefined, 2))

    const commentEvents = events.data.filter((event) => event.event === "commented")
    const issueRefsInBody = extractIssueRefs(issue.body)
    let issueRefsInComments: string[] = []
    commentEvents.map(event => {
        issueRefsInComments = issueRefsInComments.concat(extractIssueRefs(event.body!))
    })
    const issueRefs = [...new Set([...issueRefsInBody, ...issueRefsInComments])].map(issueRef => issueRef.replace("#", ""))

    core.info("found some references to other issues:")
    core.info(JSON.stringify(issueRefs))

    // todo fetch issues of refs, check for epic label (optional?)
    for (const ref in issueRefs){
        const refIssueRes = await octo.rest.issues.get({
            owner: repo.owner.login,
            repo: repo.name,
            issue_number: parseInt(ref),
        })
        const refIssue = refIssueRes.data
        if (refIssue && refIssue?.labels.map((label: any) => label.name).includes('epic')) {
            core.info(`found epic ref: ${refIssue.number} `)
            await updateEpic(token, refIssue, repo)
        }
    }

    // await wait(5000) // wait until ref appears in timeline of epic?
    // for(const crossRefEvent of crossRefEvents){
    //     await updateEpic(token, crossRefEvent.source?.issue, repo)
    // }
}

function extractIssueRefs(text: string){
    const regex = /#\d+/g
    const refs = []
    let m
    do {
        m = regex.exec(text)
        if (m) {
            refs.push(m[0])
        }
    } while (m)
    return refs
}

async function run(): Promise<void> {
    try {
        const githubToken: string = core.getInput('githubToken')
        const payload = JSON.stringify(github.context.payload, undefined, 2)
        core.info(payload)

        const issue = github.context.payload.issue
        const repo = github.context.payload.repository

        if (issue && issue?.labels.map((label: any) => label.name).includes('epic')) {
            await updateEpic(githubToken, issue, repo)
        }
        else {
            await updateNonEpic(githubToken, issue, repo)
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
