const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);
const GITHUB_OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const GITHUB_REPO_RE = /^(?!\.{1,2}$)[A-Za-z0-9._-]{1,100}$/;

export type RepoUrlValidationResult =
  | {
      isValid: true;
      normalizedUrl: string;
      owner: string;
      repo: string;
    }
  | {
      isValid: false;
      message: string;
    };

function decodePathSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

export function validateGitHubRepoUrl(value: string): RepoUrlValidationResult {
  const rawValue = value.trim();

  if (!rawValue) {
    return {
      isValid: false,
      message: "Repository URL is required.",
    };
  }

  if (rawValue.length > 2048) {
    return {
      isValid: false,
      message: "Repository URL is too long.",
    };
  }

  let parsed: URL;

  try {
    parsed = new URL(rawValue);
  } catch {
    return {
      isValid: false,
      message: "Enter a valid repository URL.",
    };
  }

  if (parsed.protocol !== "https:") {
    return {
      isValid: false,
      message: "Only HTTPS GitHub repository URLs are allowed.",
    };
  }

  if (!GITHUB_HOSTS.has(parsed.hostname.toLowerCase())) {
    return {
      isValid: false,
      message: "Only github.com repository URLs are allowed.",
    };
  }

  if (parsed.username || parsed.password) {
    return {
      isValid: false,
      message: "Repository URL must not include embedded credentials.",
    };
  }

  if (parsed.port) {
    return {
      isValid: false,
      message: "Repository URL must not include a custom port.",
    };
  }

  if (parsed.search || parsed.hash) {
    return {
      isValid: false,
      message: "Remove query strings and fragments from the repository URL.",
    };
  }

  const rawSegments = parsed.pathname.split("/").filter(Boolean);

  if (rawSegments.length !== 2) {
    return {
      isValid: false,
      message: "Enter the repository root URL in the form https://github.com/owner/repo.",
    };
  }

  const decodedOwner = decodePathSegment(rawSegments[0]);
  const decodedRepo = decodePathSegment(rawSegments[1]);

  if (!decodedOwner || !decodedRepo) {
    return {
      isValid: false,
      message: "Repository URL contains an invalid encoded path segment.",
    };
  }

  if (
    decodedOwner.includes("/") ||
    decodedOwner.includes("\\") ||
    decodedRepo.includes("/") ||
    decodedRepo.includes("\\")
  ) {
    return {
      isValid: false,
      message: "Repository URL contains an invalid path separator.",
    };
  }

  const normalizedRepoName = decodedRepo.endsWith(".git")
    ? decodedRepo.slice(0, -4)
    : decodedRepo;

  if (!GITHUB_OWNER_RE.test(decodedOwner)) {
    return {
      isValid: false,
      message: "Repository owner is not a valid GitHub owner name.",
    };
  }

  if (!GITHUB_REPO_RE.test(normalizedRepoName)) {
    return {
      isValid: false,
      message: "Repository name contains unsupported characters.",
    };
  }

  return {
    isValid: true,
    normalizedUrl: `https://github.com/${decodedOwner}/${normalizedRepoName}`,
    owner: decodedOwner,
    repo: normalizedRepoName,
  };
}
