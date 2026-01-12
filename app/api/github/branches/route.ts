import { NextRequest, NextResponse } from "next/server";
import { GitHubClient } from "@/lib/github-client";

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, accessToken } = await request.json();

    if (!repoUrl || !accessToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const urlParts = repoUrl.split("/");
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1].replace(".git", "");

    const githubClient = new GitHubClient(accessToken);
    const branches = await githubClient.listBranches(owner, repo);

    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    );
  }
}