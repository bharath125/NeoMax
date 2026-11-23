#!/usr/bin/env bash
#
# Build the frontend and publish it to S3, then refresh CloudFront.
#
#   scripts/deploy-frontend.sh [--dry-run] [--skip-build] [--prune] [--wait] [--profile NAME]
#
# Configuration comes from the environment or a git-ignored .env.deploy file in the repo root (see .env.deploy.example):
#   SITE_BUCKET                   private S3 bucket that holds the site (NOT the video bucket)
#   CLOUDFRONT_DISTRIBUTION_ID    distribution that serves the site
#   SITE_URL                      optional, printed at the end (e.g. https://app.example.com)
#   AWS_PROFILE / AWS_REGION      optional, standard AWS CLI settings
#   DIST_DIR                      optional, build output to upload (default: frontend/dist)
#
# Upload order matters. Files in assets/ have content-hashed names, so they are cached for a year, and they go up first.
# index.html is the only file that points at them, so it goes up last and is never cached. Visitors therefore see
# either the complete old release or the complete new one, never a page that references files that are not there yet.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.deploy ]]; then
	set -a
	# shellcheck disable=SC1091
	source .env.deploy
	set +a
fi

DRY_RUN=0
SKIP_BUILD=0
PRUNE=0
WAIT=0

usage() {
	sed -n '2,/^$/p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
	cat <<'USAGE'
Options:
  --dry-run      show what would be uploaded; change nothing (also skips the CloudFront invalidation)
  --skip-build   upload the existing build instead of rebuilding
  --prune        after a successful deploy, delete old files from assets/ that the new build no longer uses
  --wait         wait until the CloudFront invalidation has finished
  --profile NAME use this AWS CLI profile
USAGE
}

die() {
	echo "error: $*" >&2
	exit 1
}

step() {
	echo
	echo "==> $*"
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--dry-run) DRY_RUN=1 ;;
		--skip-build) SKIP_BUILD=1 ;;
		--prune) PRUNE=1 ;;
		--wait) WAIT=1 ;;
		--profile)
			[[ $# -ge 2 ]] || die "--profile needs a value"
			export AWS_PROFILE="$2"
			shift
			;;
		-h | --help)
			usage
			exit 0
			;;
		*)
			echo "error: unknown option: $1" >&2
			usage >&2
			exit 2
			;;
	esac
	shift
done

[[ -n "${SITE_BUCKET:-}" ]] || die "SITE_BUCKET is not set (the private S3 bucket that holds the site)"
[[ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]] || die "CLOUDFRONT_DISTRIBUTION_ID is not set"
[[ -n "${AWS_REGION:-}" ]] && export AWS_DEFAULT_REGION="$AWS_REGION"

# Refuse to deploy the site on top of the video bucket: `s3 sync --delete` would be destructive there.
if [[ -n "${S3_BUCKET:-}" && "$SITE_BUCKET" == "$S3_BUCKET" ]]; then
	die "SITE_BUCKET is the same as S3_BUCKET (the video bucket). Use a separate bucket for the website."
fi

command -v aws >/dev/null 2>&1 || die "the AWS CLI is not installed"

DIST="${DIST_DIR:-frontend/dist}"

step "Checking AWS credentials"
CALLER="$(aws sts get-caller-identity --query Arn --output text)" || die "could not authenticate with AWS (check AWS_PROFILE / credentials)"
echo "Deploying as: $CALLER"
echo "Bucket:       s3://$SITE_BUCKET"
[[ $DRY_RUN -eq 1 ]] && echo "Mode:         DRY RUN (nothing will be changed)"

if [[ $SKIP_BUILD -eq 0 ]]; then
	step "Building the frontend"
	[[ -x node_modules/.bin/vite ]] || npm ci
	npm run build --workspace frontend
fi

[[ -f "$DIST/index.html" ]] || die "$DIST/index.html not found. Run without --skip-build, or check DIST_DIR."

# --only-show-errors keeps the output readable, but a dry run is only useful if it prints what it would do.
S3_FLAGS=()
if [[ $DRY_RUN -eq 1 ]]; then
	S3_FLAGS+=(--dryrun)
else
	S3_FLAGS+=(--only-show-errors)
fi

if [[ -d "$DIST/assets" ]]; then
	step "Uploading hashed assets (cached for a year)"
	aws s3 sync "$DIST/assets/" "s3://$SITE_BUCKET/assets/" \
		--cache-control "public,max-age=31536000,immutable" "${S3_FLAGS[@]}"
fi

step "Uploading other static files (cached for a day)"
aws s3 sync "$DIST/" "s3://$SITE_BUCKET/" \
	--exclude "assets/*" --exclude "index.html" \
	--cache-control "public,max-age=86400" "${S3_FLAGS[@]}"

step "Publishing index.html (never cached)"
aws s3 cp "$DIST/index.html" "s3://$SITE_BUCKET/index.html" \
	--cache-control "no-cache" --content-type "text/html; charset=utf-8" "${S3_FLAGS[@]}"

if [[ $PRUNE -eq 1 && -d "$DIST/assets" ]]; then
	step "Removing assets the new build no longer uses"
	aws s3 sync "$DIST/assets/" "s3://$SITE_BUCKET/assets/" --delete "${S3_FLAGS[@]}"
fi

if [[ $DRY_RUN -eq 1 ]]; then
	echo
	echo "Dry run finished. Nothing was uploaded and CloudFront was not touched."
	exit 0
fi

# "/" is the default root object, which CloudFront caches separately from "/index.html".
step "Invalidating CloudFront"
INVALIDATION_ID="$(aws cloudfront create-invalidation \
	--distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
	--paths "/" "/index.html" \
	--query 'Invalidation.Id' --output text)"
echo "Invalidation $INVALIDATION_ID created"

if [[ $WAIT -eq 1 ]]; then
	echo "Waiting for it to finish (usually a minute or two)..."
	aws cloudfront wait invalidation-completed --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --id "$INVALIDATION_ID"
fi

echo
echo "Deployed to s3://$SITE_BUCKET"
[[ -n "${SITE_URL:-}" ]] && echo "Live at: $SITE_URL"
exit 0
