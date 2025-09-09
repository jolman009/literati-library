  🛡️ Prevention Strategies

  1. Git Configuration (Recommended):
  git config core.autocrlf input
  This tells Git to convert CRLF to LF when committing.

  2. .gitattributes File:
  Add to your repository root:
  *.sh text eol=lf
  docker-entrypoint.sh text eol=lf

  3. Editor Settings:
  Configure your editor to use LF line endings for shell scripts.

  ★ Insight ─────────────────────────────────────
  Line Ending Issues in Docker: This is a classic Windows/Linux compatibility issue. Shell scripts with CRLF line
  endings are interpreted by Linux as having invisible \r characters, making the shebang #!/bin/sh\r invalid. The
  dos2unix utility cleanly converts these, but prevention through proper Git configuration is the best long-term
  solution.

  Docker on Windows: Modern Docker Desktop handles most cross-platform issues automatically, but file line endings
  remain a common gotcha that can cause mysterious startup failures.