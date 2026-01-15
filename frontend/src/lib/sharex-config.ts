/**
 * ShareX Configuration Generator
 * Generates ShareX configuration files with support for multiple versions
 */

export type ShareXVersion = "13.x" | "14.x" | "15.x" | "16.x" | "17.x" | "18.x";

export interface ShareXConfigOptions {
  apiKey: string;
  baseUrl: string;
  version: ShareXVersion;
}

interface ShareXConfigBase {
  Name: string;
  DestinationType: string[];
  RequestMethod: string;
  RequestURL: string;
  Body: string;
  FileFormName: string;
}

// Legacy config structure (v13.x - v15.x)
interface ShareXConfigLegacy extends ShareXConfigBase {
  Headers?: {
    Authorization?: string;
  };
  Arguments?: Record<string, string>;
  URL?: string;
  ThumbnailURL?: string;
  DeletionURL?: string;
}

// Modern config structure (v16.x+)
interface ShareXConfigModern extends ShareXConfigBase {
  Version: string;
  Headers: {
    Authorization: string;
  };
  Arguments: Record<string, string>;
  ResponseType: string;
  URL: string;
  ThumbnailURL: string;
  DeletionURL: string;
}

type ShareXConfig = ShareXConfigLegacy | ShareXConfigModern;

/**
 * Version metadata for display purposes
 */
export const SHAREX_VERSIONS: Record<ShareXVersion, { label: string; recommended: boolean }> = {
  "13.x": { label: "ShareX 13.x (Legacy)", recommended: false },
  "14.x": { label: "ShareX 14.x (Legacy)", recommended: false },
  "15.x": { label: "ShareX 15.x", recommended: false },
  "16.x": { label: "ShareX 16.x", recommended: false },
  "17.x": { label: "ShareX 17.x", recommended: false },
  "18.x": { label: "ShareX 18.x (Latest)", recommended: true },
};

/**
 * Generates a ShareX configuration object based on the specified version
 */
export function generateShareXConfig(options: ShareXConfigOptions): ShareXConfig {
  const { apiKey, baseUrl, version } = options;

  // Base configuration shared across all versions
  const baseConfig: ShareXConfigBase = {
    Name: "twink.forsale",
    DestinationType: ["ImageUploader", "TextUploader", "FileUploader"],
    RequestMethod: "POST",
    RequestURL: `${baseUrl}/api/upload`,
    Body: "MultipartFormData",
    FileFormName: "file",
  };

  // Legacy versions (13.x - 15.x) - Simpler structure
  if (version === "13.x" || version === "14.x" || version === "15.x") {
    return {
      ...baseConfig,
      Headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      Arguments: {},
      URL: "$json:url$",
      ThumbnailURL: "$json:thumbnail_url$",
      DeletionURL: "$json:deletion_url$",
    } as ShareXConfigLegacy;
  }

  // Modern versions (16.x+) - Full featured structure
  const versionNumber = version === "16.x" ? "16.0.0" :
                        version === "17.x" ? "17.0.0" :
                        "18.0.1";

  return {
    Version: versionNumber,
    ...baseConfig,
    Headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    Arguments: {},
    ResponseType: "JSON",
    URL: "{json:url}",
    ThumbnailURL: "{json:thumbnail_url}",
    DeletionURL: "{json:deletion_url}",
  } as ShareXConfigModern;
}

/**
 * Downloads a ShareX configuration file
 * This function is intended to be called from the client-side
 */
export function downloadShareXConfig(config: ShareXConfig, filename = "twink-forsale.sxcu"): void {
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Get recommended version
 */
export function getRecommendedVersion(): ShareXVersion {
  return "18.x";
}

/**
 * Get all available versions
 */
export function getAvailableVersions(): ShareXVersion[] {
  return Object.keys(SHAREX_VERSIONS) as ShareXVersion[];
}
