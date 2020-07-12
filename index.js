const core = require('@actions/core');
const github = require('@actions/github');

try {
  const token = core.getInput('access-token');
  const octokit = github.getOctokit(token);
  octokit.check.create({
    ...github.context.repo,
    head_sha: github.context.sha,
    name: 'Test check',
    conclusion: 'success',
    output: {
      title: 'Test',
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
} catch (error) {
  core.setFailed(error.message);
}
