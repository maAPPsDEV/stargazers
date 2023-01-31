require('dotenv').config();
const { Octokit } = require('@octokit/core');
const fs = require('fs')

const main = async () => {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  // Get the list of public repositories
  const { data: repos } = await octokit.request('GET /users/{username}/repos{?type,sort,direction,per_page,page}', {
    username: process.env.GITHUB_USERNAME,
    type: 'public',
    per_page: 100,
  })

  console.log("repos", repos.length)

  // Collect stargazers of the repositories
  const stargazers = (await Promise.all(repos.map(async ({ name }) => {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/stargazers{?per_page,page}', {
      owner: process.env.GITHUB_USERNAME,
      repo: name,
      per_page: 100
    })
    return data.map(({ login }) => login)
  }))).flat().reduce(
    (unique, item) => (unique.includes(item) ? unique : [...unique, item]),
    [],
  ).sort((a, b) => {
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });

  // Rebuild README
  const text = `# stargazers
⭐⭐⭐ List All Stargazers (who have starred my public repositories.)

# Special Thanks 🙏🙏🙏
(The list is manually updated, please contact me if you don't see your name. ❤️)

` + stargazers.map(username => `🤩 [${username}](https://github.com/${username})`).join('\n\n')

  fs.writeFile('README.md', text, (err) => {
    if (err) console.log(err)
  })
}

main();
