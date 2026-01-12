import { NextRequest, NextResponse } from "next/server";
import { GitHubClient } from "@/lib/github-client";

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, content, branch, accessToken } = await request.json();

    if (!repoUrl || !content || !accessToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Extract owner and repo from URL
    const urlParts = repoUrl.split("/");
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1].replace(".git", "");

    const githubClient = new GitHubClient(accessToken);

    // Check write access
    const hasAccess = await githubClient.checkWriteAccess(owner, repo);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have write access to this repository" },
        { status: 403 }
      );
    }

    // Apply the README
    const result = await githubClient.createOrUpdateReadme(
      owner,
      repo,
      content,
      branch || "main"
    );

    return NextResponse.json({
      success: true,
      message: "README applied successfully",
      commit: result.commit,
    });
  } catch (error) {
    console.error("Error applying README:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply README" },
      { status: 500 }
    );
  }
}