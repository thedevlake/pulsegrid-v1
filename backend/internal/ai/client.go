package ai

import (
	"context"
)

// AIClient is an interface for AI prediction text generation
// Both OpenAI and Ollama clients implement this interface
type AIClient interface {
	GeneratePredictionText(ctx context.Context, metrics AggregatedMetrics) (*PredictionTextResponse, error)
}

