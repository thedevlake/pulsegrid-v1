.PHONY: test test-coverage lint build run

# Run all tests
test:
	go test -v ./...

# Run tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Run linter
lint:
	golangci-lint run ./...

# Build the application
build:
	go build -o bin/api ./cmd/api/main.go
	go build -o bin/scheduler ./cmd/scheduler/main.go

# Run the API server
run:
	go run ./cmd/api/main.go

# Install dependencies
deps:
	go mod download
	go mod tidy

# Install development tools
install-tools:
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest





