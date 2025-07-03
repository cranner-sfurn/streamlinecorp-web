const fs = require("fs");

const resultsPath = "results.json";
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

  if (!results.runs || results.runs.length === 0) {
    md += "No test runs found.";
    fs.writeFileSync(outputPath, md);
    return;
  }

  results.runs.forEach((run) => {
    md += `### Spec: \`${run.spec.name}\`\n`;
    if (!run.tests || run.tests.length === 0) {
      md += "- ⚠️ No tests found in this spec.\n";
      return;
    }
    run.tests.forEach((test) => {
      totalTests++;
      const status =
        test.state === "passed" ? "✅" : test.state === "failed" ? "❌" : "⚠️";
      if (test.state === "passed") totalPassed++;
      if (test.state === "failed") totalFailed++;
      md += `- ${status} ${test.title.join(" > ")}`;
      if (test.state === "failed" && test.displayError) {
        md += `\n    - Error: \`${test.displayError.split("\n")[0]}\``;
      }
      md += "\n";
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
