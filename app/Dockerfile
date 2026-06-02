# syntax=docker/dockerfile:1.17

# Build stage for frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/web

# pnpm 10 treats ignored dependency build scripts (e.g. esbuild) as a hard error
# in a non-CI context; CI=true downgrades it to a warning. esbuild's native binary
# is provided via optionalDependencies, so skipping its build script is harmless.
ENV CI=true

COPY web/package.json web/pnpm-lock.yaml* web/pnpm-workspace.yaml ./

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY web/ .
RUN pnpm run build

# Build stage for backend
FROM golang:1.26-alpine AS backend-builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o roborock-mqtt .

# Final stage
FROM gcr.io/distroless/static:nonroot

WORKDIR /

COPY --from=backend-builder /app/roborock-mqtt /roborock-mqtt
COPY --from=frontend-builder /app/web/dist /web/dist

USER nonroot:nonroot

ENTRYPOINT ["/roborock-mqtt", "/var/lib/roborock-mqtt/config.json"]
