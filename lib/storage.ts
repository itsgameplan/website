import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

/**
 * Neon Object Storage (S3-compatible, branch-scoped) via the Files SDK.
 * The `neon` adapter reads AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and
 * AWS_REGION, which `neon deploy` / `neon env pull` write for the linked branch.
 * The bucket is declared in neon.ts.
 */
export const ASSETS_BUCKET = "assets";

let assetsFiles: Files | undefined;

/** private `assets` bucket: admin exports (presigned links only, never public) */
export function assets() {
  assetsFiles ??= new Files({ adapter: neon({ bucket: ASSETS_BUCKET }) });
  return assetsFiles;
}

export const storageConfigured = () => Boolean(process.env.AWS_ENDPOINT_URL_S3 && process.env.AWS_ACCESS_KEY_ID);
