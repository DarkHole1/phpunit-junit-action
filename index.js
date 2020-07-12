const root = require('process').cwd();
const core = require('@actions/core');
const github = require('@actions/github');
const JUnit = require('./junit');

async function main() {
  const junit = new JUnit(core.getInput('file'));
  await junit.parse();
  junit.dropPrefixPath(cwd+'/');

  const conclusion = (junit.stats.failures <= 0) ? 'success' : 'failure';
  const summary = makeSummary(junit);
  const annotations = makeAnnotations(junit);

  sendCheck(
    'PHPUnit',
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
  return [];
}

function sendCheck(name, title, conclusion, summary, annotations) {
  const token = core.getInput('access-token');
  const octokit = github.getOctokit(token);
  octokit.checks.create({
    ...github.context.repo,
    head_sha: github.context.sha,
    name: 'PHPUnit',
    conclusion: 'success',
    output: {
      title: 'PHPUnit tests',
      summary: 'Hello',
      annotations: [{
        path: 'index.js',
        start_line: 1,
        end_line: 1,
        annotation_level: 'notice',
        message: 'Hello world'
      }]
    }
  });
}

main().catch(e => core.setFailed(error.message));
