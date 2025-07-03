const fs = require("fs");

const resultsPath = process.argv[2] || "mochawesome.json";
const outputPath = "results.md";

function main() {
  if (!fs.existsSync(resultsPath)) {
    fs.writeFileSync(outputPath, "❌ No Cypress results found.");
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
  let md = `## 🧪 E2E Test Results\n\n`;
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  if (!results.results || results.results.length === 0) {
    md += "No test runs found.";
    fs.writeFileSync(outputPath, md);
    return;
  }

  results.results.forEach((run) => {
    md += `### Spec: \`${run.file}\`\n`;
    if (!run.suites || run.suites.length === 0) {
      md += "- ⚠️ No tests found in this spec.\n";
      return;
    }
    run.suites.forEach((suite) => {
      suite.tests.forEach((test) => {
        totalTests++;
        const status = test.pass ? "✅" : test.fail ? "❌" : "⚠️";
        if (test.pass) totalPassed++;
        if (test.fail) totalFailed++;
        md += `- ${status} ${test.fullTitle}`;
        if (test.fail && test.err && test.err.message) {
          md += `\n    - Error: \`${test.err.message.split("\n")[0]}\``;
        }
        md += "\n";
      });
    });
    md += "\n";
  });

  md =
    `# 🧪 E2E Test Results\n\n` +
    `**Total tests:** ${totalTests}\n` +
    `**Passed:** ${totalPassed} ✅\n` +
    `**Failed:** ${totalFailed} ❌\n\n` +
    md;

  fs.writeFileSync(outputPath, md);
}

main();
