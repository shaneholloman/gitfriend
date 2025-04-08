import { Octokit } from "@octokit/rest";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, customInstructions } = await req.json();

    const match = repoUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.git)?$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
    }

    const [_, owner, repo] = match;

    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const { data: contents } = await octokit.repos.getContent({ owner, repo, path: "" });

    const files = Array.isArray(contents)
      ? contents.filter(item => item.type === "file").map(item => `- ${item.name}`).join("\n")
      : "No files found.";

    const languages = await fetchLanguages(owner, repo);
    const languageList = Object.keys(languages).join(", ");

    const basePrompt = `
# Context
You're a top-tier technical writer and open-source expert. Write a high-quality, professional, well-structured, visually appealing \`README.md\` file in **Markdown** based on the following GitHub repo data:

## Repository Information
- **Name**: ${repoData.name}
- **Description**: ${repoData.description || "No description"}
- **Stars**: ${repoData.stargazers_count}
- **Forks**: ${repoData.forks_count}
- **Languages**: ${languageList}

## Files
${files}

# Instructions
Write the README in the style of modern open-source projects like **Mark Flow**, following this structure:

1. Project Title + 1-line description + relevant emoji(s)
2. Stylish badges (license, tech stack versions, etc.)
3. ✨ Key Features (bullet list with emoji)
4. ⚙️ Tech Stack (frameworks, libraries, tools with emojis)
5. 🚀 Getting Started (prerequisites, installation, env setup, dev server)
6. ✍️ Usage (steps to use the app, important flows)
7. 🔐 API Authentication (if applicable)
8. 🛡️ Rate Limiting or Security Features (if applicable)
9. 🤝 Contributing (steps to contribute)
10. 📝 License

If applicable, infer any smart details (e.g., tech stack, instructions) from filenames or context.

${customInstructions ? `# Additional User Instructions\n${customInstructions}` : ""}

# Output
Return only the final \`README.md\` content, no explanation or headers.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: basePrompt },
        { role: "user", content: "Generate the complete README.md file." },
      ],
      temperature: 0.7,
    });

    const generatedReadme = completion.choices[0]?.message?.content;

    if (!generatedReadme) {
      return NextResponse.json({ error: "Failed to generate README" }, { status: 500 });
    }

    return NextResponse.json({ readme: generatedReadme });
  } catch (error: any) {
    console.error("Error generating README:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: error.message },
      { status: 500 }
    );
  }
}

async function fetchLanguages(owner: string, repo: string) {
  const { data } = await octokit.repos.listLanguages({ owner, repo });
  return data;
}