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

// OpenAIClient wraps the OpenAI API client
type OpenAIClient struct {
	client           *openai.Client
	model            string
	timeout          time.Duration
	quotaExceeded    bool
	quotaExceededAt  time.Time
	quotaRetryAfter  time.Duration // How long to wait before retrying after quota error
	rateLimiter      sync.Mutex    // Mutex for rate limiting
	lastRequestTime  time.Time     // Track last API request time
	minRequestGap    time.Duration // Minimum time between requests (rate limiting)
}

// NewOpenAIClient creates a new OpenAI client
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
		quotaRetryAfter: 1 * time.Hour, // Wait 1 hour before retrying after quota error
		minRequestGap:   2 * time.Second, // Rate limit: max 1 request per 2 seconds
	}
}

// PredictionTextResponse represents the structured response from OpenAI
type PredictionTextResponse struct {
	PredictedIssue      string `json:"predicted_issue"`
	Reason              string `json:"reason"`
	RecommendedAction   string `json:"recommended_action"`
}

// AggregatedMetrics represents aggregated health check data for OpenAI analysis
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

// GeneratePredictionText generates natural language descriptions using OpenAI
func (c *OpenAIClient) GeneratePredictionText(ctx context.Context, metrics AggregatedMetrics) (*PredictionTextResponse, error) {
	if c == nil || c.client == nil {
		return nil, fmt.Errorf("OpenAI client not initialized")
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()

	// Build the prompt
	prompt := c.buildPrompt(metrics)

	// Create the chat completion request
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

	// Check if we're in a quota-exceeded cooldown period
	if c.quotaExceeded {
		if time.Since(c.quotaExceededAt) < c.quotaRetryAfter {
			return nil, fmt.Errorf("OpenAI quota exceeded, retry after %v", c.quotaRetryAfter-time.Since(c.quotaExceededAt))
		}
		// Reset quota flag after cooldown period
		c.quotaExceeded = false
	}

	// Rate limiting: ensure minimum gap between requests
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

	// Make the API call
	resp, err := c.client.CreateChatCompletion(ctx, req)
	if err != nil {
		// Check if it's a quota/rate limit error (429)
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

	// Parse the JSON response
	content := resp.Choices[0].Message.Content
	var predictionText PredictionTextResponse
	if err := json.Unmarshal([]byte(content), &predictionText); err != nil {
		log.Printf("Failed to parse OpenAI JSON response: %v, content: %s", err, content)
		return nil, fmt.Errorf("failed to parse OpenAI response: %w", err)
	}

	return &predictionText, nil
}

// contains checks if a string contains a substring (case-insensitive)
func contains(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

// buildPrompt constructs the prompt for OpenAI
func (c *OpenAIClient) buildPrompt(metrics AggregatedMetrics) string {
	return fmt.Sprintf(`Analyze the following service monitoring data and provide insights:

Service: %s (%s)
URL: %s
Time Window: %s

Metrics:
- Total Health Checks: %d
- Failure Rate: %.1f%%
- Average Response Time: %.0f ms
- Response Time Trend: %s
- Status Breakdown: %v
- Anomalies Detected: %d
- Anomaly Details: %v

Statistical Analysis:
- Risk Level: %s
- Confidence: %.0f%%

Based on this data, provide a JSON response with exactly these three fields:
1. "predicted_issue": A concise description (1-2 sentences) of the potential issue
2. "reason": A brief explanation (2-3 sentences) of why this prediction was made based on the metrics
3. "recommended_action": Specific, actionable steps (2-3 sentences) to address or prevent the issue

Be specific, technical, and actionable. Focus on what the metrics indicate and what should be done.`,
		metrics.ServiceName,
		metrics.ServiceType,
		metrics.ServiceURL,
		metrics.TimeWindow,
		metrics.TotalChecks,
		metrics.FailureRate*100,
		metrics.AverageResponseTime,
		metrics.ResponseTimeTrend,
		metrics.StatusBreakdown,
		metrics.AnomalyCount,
		metrics.AnomalyDetails,
		metrics.RiskLevel,
		metrics.Confidence*100,
	)
}

