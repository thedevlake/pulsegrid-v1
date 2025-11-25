package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/sashabaranov/go-openai"
)

type OpenAIClient struct {
	client           *openai.Client
	model            string
	timeout          time.Duration
	quotaExceeded    bool
	quotaExceededAt  time.Time
	quotaRetryAfter  time.Duration
	rateLimiter      sync.Mutex
	lastRequestTime  time.Time
	minRequestGap    time.Duration
}

func NewOpenAIClient(apiKey, model string, timeout time.Duration) *OpenAIClient {
	if apiKey == "" {
		return nil
	}

	config := openai.DefaultConfig(apiKey)
	client := openai.NewClientWithConfig(config)

	return &OpenAIClient{
		client:          client,
		model:           model,
		timeout:         timeout,
		quotaExceeded:   false,
		quotaRetryAfter: 1 * time.Hour,
		minRequestGap:   2 * time.Second,
	}
}

type PredictionTextResponse struct {
	PredictedIssue      string `json:"predicted_issue"`
	Reason              string `json:"reason"`
	RecommendedAction   string `json:"recommended_action"`
}

type AggregatedMetrics struct {
	ServiceName        string            `json:"service_name"`
	ServiceType        string            `json:"service_type"`
	ServiceURL         string            `json:"service_url"`
	TimeWindow         string            `json:"time_window"`
	TotalChecks        int               `json:"total_checks"`
	FailureRate        float64           `json:"failure_rate"`
	AverageResponseTime float64          `json:"average_response_time_ms"`
	ResponseTimeTrend   string           `json:"response_time_trend"`
	StatusBreakdown     map[string]int   `json:"status_breakdown"`
	AnomalyCount        int              `json:"anomaly_count"`
	AnomalyDetails      []string         `json:"anomaly_details"`
	RiskLevel           string           `json:"risk_level"`
	Confidence          float64           `json:"confidence"`
}

func (c *OpenAIClient) GeneratePredictionText(ctx context.Context, metrics AggregatedMetrics) (*PredictionTextResponse, error) {
	if c == nil || c.client == nil {
		return nil, fmt.Errorf("OpenAI client not initialized")
	}

	ctx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()

	prompt := buildPrompt(metrics)

	req := openai.ChatCompletionRequest{
		Model: c.model,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: "You are an expert IT monitoring and DevOps engineer. Analyze service health metrics and provide concise, actionable insights. Always respond with valid JSON only.",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Temperature: 0.7,
		MaxTokens:   300,
		ResponseFormat: &openai.ChatCompletionResponseFormat{
			Type: openai.ChatCompletionResponseFormatTypeJSONObject,
		},
	}

	if c.quotaExceeded {
		if time.Since(c.quotaExceededAt) < c.quotaRetryAfter {
			return nil, fmt.Errorf("OpenAI quota exceeded, retry after %v", c.quotaRetryAfter-time.Since(c.quotaExceededAt))
		}
		c.quotaExceeded = false
	}

	c.rateLimiter.Lock()
	timeSinceLastRequest := time.Since(c.lastRequestTime)
	if timeSinceLastRequest < c.minRequestGap {
		waitTime := c.minRequestGap - timeSinceLastRequest
		c.rateLimiter.Unlock()
		time.Sleep(waitTime)
		c.rateLimiter.Lock()
	}
	c.lastRequestTime = time.Now()
	c.rateLimiter.Unlock()

	resp, err := c.client.CreateChatCompletion(ctx, req)
	if err != nil {
		errStr := err.Error()
		if contains(errStr, "429") || contains(errStr, "quota") || contains(errStr, "rate limit") {
			c.quotaExceeded = true
			c.quotaExceededAt = time.Now()
			log.Printf("⚠️ OpenAI quota exceeded. Will retry after %v. Using fallback descriptions until then.", c.quotaRetryAfter)
		}
		return nil, fmt.Errorf("OpenAI API error: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	content := resp.Choices[0].Message.Content
	var predictionText PredictionTextResponse
	if err := json.Unmarshal([]byte(content), &predictionText); err != nil {
		log.Printf("Failed to parse OpenAI JSON response: %v, content: %s", err, content)
		return nil, fmt.Errorf("failed to parse OpenAI response: %w", err)
	}

	return &predictionText, nil
}

func contains(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

func (c *OpenAIClient) buildPrompt(metrics AggregatedMetrics) string {
	return buildPrompt(metrics)
}

