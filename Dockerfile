#
# One image for the API and the video worker (docker-compose.yml starts it with different commands).
# Build from the repository root:  docker build -t neomax-backend .

# ---- Stage 1: production dependencies only ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app

# The repo is an npm workspace, so the lockfile lives at the root. npm checks every workspace's package.json against it,
# so the frontend manifest is copied too (but none of the frontend's source or dependencies).
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN npm ci --omit=dev --workspace=backend --include-workspace-root=false \
	&& mkdir -p backend/node_modules

# ---- Stage 2: runtime ----
FROM node:22-bookworm-slim

# ffmpeg/ffprobe are required: the worker extracts last frames, and scene export joins clips.
# tini runs as PID 1 so SIGTERM from `docker stop` reaches Node and in-flight jobs can finish cleanly.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ffmpeg tini \
	&& rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend

# The base image ships an unprivileged "node" user; never run the app as root.
USER node
WORKDIR /app/backend

EXPOSE 4000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
