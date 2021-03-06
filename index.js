const root = require('process').cwd();
const core = require('@actions/core');
const github = require('@actions/github');
const JUnit = require('./junit');

async function main() {
  console.log('start');
  const junit = new JUnit(core.getInput('file'));
  await junit.parse();
  junit.dropPrefixPath(root+'/');

  console.log(junit.stats);

  const conclusion = (junit.stats.failures <= 0) ? 'success' : 'failure';
  const summary = makeSummary(junit);
  const annotations = makeAnnotations(junit);

  await sendCheck(
    'PHPUnit check',
    'PHPUnit tests',
    conclusion,
    summary,
    annotations
  );
}

function makeSummary(junit) {
  const stats = junit.stats;
  return (
    `Total tests: ${stats.tests}\n` +
    `Errors: ${stats.errors}\n` +
    `Warnings: ${stats.warnings}\n` +
    `Failures: ${stats.failures}\n` +
    `Skipped: ${stats.skipped}\n` +
    `Time: ${stats.time}`
  );
}

function makeAnnotations(junit) {
  let res = [];
  const failed = junit.getFailed();

  for(const suite of failed) {
    for(const _case of suite.cases) {
      for(const failure of _case.failures) {
        res.push({
          title: _case.stats.name,
          annotation_level: 'failure',
          path: _case.stats.file,
          start_line: _case.stats.line,
          end_line: _case.stats.line,
          message: failure.message
        });
      }
    }
  }

  return res;
}

async function sendCheck(name, title, conclusion, summary, annotations) {
  const token = core.getInput('access-token');
  const octokit = github.getOctokit(token);
  const baseData = {
    ...github.context.repo,
    head_sha: getHeadSha(),
  };

  let res = await octokit.checks.create({
    ...baseData,
    name: name,
    conclusion: conclusion,
    output: { title, summary, annotations: annotations.slice(0, 50) }
  });

  console.log(res);

  let batchAnnotations = annotations.slice(50);
  while(batchAnnotations.length > 0) {
    res = await octokit.checks.update({
      ...baseData,
      output: { annotations: batchAnnotations.slice(0, 50) }
    });
    console.log(res);
    batchAnnotations = batchAnnotations.slice(50);
  }
}

function getHeadSha() {
  if (github.context.payload.pull_request) {
    return github.context.payload.pull_request.head.sha;
  }

  return github.context.sha;
}

main().catch(e => core.setFailed(e.message));
