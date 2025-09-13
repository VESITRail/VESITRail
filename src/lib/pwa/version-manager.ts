import { PWA_CONFIG } from "./config";

type VersionInfo = {
  version: string;
  tagName: string;
  timestamp: number;
};

type GitHubRelease = {
  name: string;
  draft: boolean;
  tag_name: string;
  prerelease: boolean;
  published_at: string;
};

class VersionManager {
  private readonly fallbackVersion = "1.0.0";
  private cachedVersion: VersionInfo | null = null;
  private readonly repoName = PWA_CONFIG.github.repo;
  private readonly repoOwner = PWA_CONFIG.github.owner;
  private readonly storageKey = PWA_CONFIG.version.storageKey;

  async getCurrentVersion(): Promise<VersionInfo | null> {
    if (this.cachedVersion) {
      return this.cachedVersion;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as VersionInfo;
        this.cachedVersion = parsed;
        return parsed;
      }
    } catch (error) {
      console.error("Failed to parse stored version:", error);
    }

    return this.getFallbackVersion();
  }

  async getLatestRelease(): Promise<VersionInfo | null> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases/latest`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = (await response.json()) as GitHubRelease;

      if (data.draft || data.prerelease) {
        throw new Error("Latest release is draft or prerelease");
      }

      const versionInfo: VersionInfo = {
        timestamp: Date.now(),
        tagName: data.tag_name,
        version: data.tag_name.replace(/^v/, ""),
      };

      return versionInfo;
    } catch (error) {
      console.error("Failed to fetch latest release from GitHub:", error);
      return null;
    }
  }

  private getFallbackVersion(): VersionInfo {
    const fallback: VersionInfo = {
      timestamp: Date.now(),
      version: this.fallbackVersion,
      tagName: `v${this.fallbackVersion}`,
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(fallback));
    } catch (error) {
      console.warn("Failed to store fallback version:", error);
    }

    this.cachedVersion = fallback;
    return fallback;
  }

  compareVersions(currentVersion: string, newVersion: string): number {
    const latest = newVersion.split(".").map(Number);
    const current = currentVersion.split(".").map(Number);

    for (let i = 0; i < Math.max(current.length, latest.length); i++) {
      const latestPart = latest[i] || 0;
      const currentPart = current[i] || 0;

      if (currentPart < latestPart) return -1;
      if (currentPart > latestPart) return 1;
    }

    return 0;
  }

  async checkForUpdates(): Promise<boolean> {
    const current = await this.getCurrentVersion();
    if (!current) return false;

    const latest = await this.getLatestRelease();
    if (!latest) return false;

    return this.compareVersions(current.version, latest.version) < 0;
  }

  async storeNewVersion(version: string, tagName: string): Promise<void> {
    const versionInfo: VersionInfo = {
      tagName: tagName,
      timestamp: Date.now(),
      version: version.replace(/^v/, ""),
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(versionInfo));
      this.cachedVersion = versionInfo;
    } catch (error) {
      console.warn("Failed to store new version:", error);
    }
  }

  clearCache(): void {
    this.cachedVersion = null;
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn("Failed to clear version cache:", error);
    }
  }

  async getVersionString(): Promise<string> {
    const version = await this.getCurrentVersion();
    return version ? `v${version.version}` : `v${this.fallbackVersion}`;
  }
}

export type { VersionInfo };
export const versionManager = new VersionManager();
