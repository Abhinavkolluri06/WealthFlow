# Step 1: Build the Go binary
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Build the application from the cmd/api directory
RUN go build -o main ./cmd/api/main.go

# Step 2: Create a tiny runtime image
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]