/**
 * Footer line: proves which build is running. Vercel sets VERCEL_GIT_COMMIT_SHA at build time.
 * - Localhost: you should see "Local dev (not deployed)".
 * - Production after a good deploy: "Live deploy ·" + 7-char sha matching GitHub.
 * If production still shows an old SHA or the red warning, the Vercel project is not building this repo/branch.
 */
export function DeployStamp() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  const onVercel = process.env.VERCEL === "1";

  if (!onVercel) {
    return (
      <p
        className="pointer-events-none text-center font-mono text-xs text-amber-600/90 dark:text-amber-400/90 pb-3"
        title="You are on local dev. Production only updates after git push and a successful Vercel build."
      >
        Local dev — not deployed (push to GitHub + Vercel build = live site)
      </p>
    );
  }

  if (!sha) {
    return (
      <p
        className="pointer-events-none text-center font-mono text-xs text-red-500 pb-3"
        title="Vercel did not inject VERCEL_GIT_COMMIT_SHA — check Git integration / redeploy from dashboard."
      >
        Deploy marker missing — Vercel Git metadata not available
      </p>
    );
  }

  return (
    <p
      className="pointer-events-none text-center font-mono text-xs text-emerald-700/90 dark:text-emerald-400/90 pb-3"
      title={`This production build is from Git commit ${sha}`}
    >
      Live deploy · {sha.slice(0, 7)}
    </p>
  );
}
