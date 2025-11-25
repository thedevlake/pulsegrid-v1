package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// OllamaClient handles communication with Ollama API
type OllamaClient struct {
	baseURL string
	model   string
	timeout time.Duration
	client  *http.Client
}

// NewOllamaClient creates a new Ollama client
func NewOllamaClient(baseURL, model string, timeout time.Duration) *OllamaClient {
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}
	if model == "" {
		model = "llama2"
	}

	return &OllamaClient{
		baseURL: baseURL,
		model:   model,
		timeout: timeout,
		client: &http.Client{
			Timeout: timeout,
		},
	}
}

// OllamaChatRequest represents the request format for Ollama API
type OllamaChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
	Format   string    `json:"format,omitempty"`
}

// Message represents a chat message
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OllamaChatResponse represents the response from Ollama API
type OllamaChatResponse struct {
	Message struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"message"`
	Done bool `json:"done"`
}

// GeneratePredictionText generates prediction text using Ollama
func (c *OllamaClient) GeneratePredictionText(ctx context.Context, metrics AggregatedMetrics) (*PredictionTextResponse, error) {
	if c == nil {
		return nil, fmt.Errorf("ollama client not initialized")
	}

	ctx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()

	prompt := buildPrompt(metrics)

	// Build messages for Ollama
	messages := []Message{
		{
			Role:    "system",
			Content: "You are an expert IT monitoring and DevOps engineer. Analyze service health metrics and provide concise, actionable insights. Always respond with valid JSON only.",
		},
		{
			Role:    "user",
			Content: prompt + "\n\nRespond with valid JSON containing exactly these fields: predicted_issue, reason, recommended_action",
		},
	}

	reqBody := OllamaChatRequest{
		Model:    c.model,
		Messages: messages,
		Stream:   false,
		Format:   "json",
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/api/chat", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ollama API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ollama API error (status %d): %s", resp.StatusCode, string(body))
	}

	var ollamaResp OllamaChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
		return nil, fmt.Errorf("failed to decode Ollama response: %w", err)
	}

	content := ollamaResp.Message.Content

	// Try to parse JSON response
	var predictionText PredictionTextResponse
	if err := json.Unmarshal([]byte(content), &predictionText); err != nil {
		// If direct JSON parsing fails, try to extract JSON from the response
		log.Printf("Failed to parse Ollama JSON response directly: %v. Content: %s", err, content)
		
		// Try to find JSON object in the response
		jsonStart := -1
		jsonEnd := -1
		for i, char := range content {
			if char == '{' && jsonStart == -1 {
				jsonStart = i
			}
			if char == '}' && jsonStart != -1 {
				jsonEnd = i + 1
				break
			}
		}
		
		if jsonStart != -1 && jsonEnd != -1 {
			jsonStr := content[jsonStart:jsonEnd]
			if err := json.Unmarshal([]byte(jsonStr), &predictionText); err == nil {
				return &predictionText, nil
			}
		}
		
		return nil, fmt.Errorf("failed to parse Ollama response as JSON: %w", err)
	}

	return &predictionText, nil
}

// buildPrompt is shared with OpenAI client
func buildPrompt(metrics AggregatedMetrics) string {
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

