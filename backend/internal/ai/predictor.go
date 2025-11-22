package ai

import (
	"context"
	"fmt"
	"log"
	"math"
	"time"

	"pulsegrid/backend/internal/models"
)

// Prediction represents an AI-driven incident prediction
type Prediction struct {
	ServiceID       string    `json:"service_id"`
	ServiceName     string    `json:"service_name"`
	RiskLevel       string    `json:"risk_level"` // low, medium, high, critical
	Confidence      float64   `json:"confidence"` // 0.0 to 1.0
	PredictedIssue  string    `json:"predicted_issue"`
	TimeWindow      string    `json:"time_window"` // e.g., "within 1 hour", "within 24 hours"
	Reason          string    `json:"reason"`
	RecommendedAction string  `json:"recommended_action"`
	PredictedAt     time.Time `json:"predicted_at"`
}

type Predictor struct {
	openAIClient *OpenAIClient
}

func NewPredictor(openAIClient *OpenAIClient) *Predictor {
	return &Predictor{
		openAIClient: openAIClient,
	}
}

func (p *Predictor) AnalyzeService(service *models.Service, healthChecks []*models.HealthCheck) *Prediction {
	if len(healthChecks) < 10 {
		return nil
	}

	recentChecks := getRecentChecks(healthChecks, 24*time.Hour)
	if len(recentChecks) < 5 {
		return nil
	}

	responseTimeTrend := analyzeResponseTimeTrend(recentChecks)
	statusPattern := analyzeStatusPattern(recentChecks)
	failureRate := calculateFailureRate(recentChecks)
	anomalies := detectAnomalies(recentChecks)
	
	prediction := p.generatePrediction(
		service,
		responseTimeTrend,
		statusPattern,
		failureRate,
		anomalies,
		recentChecks,
	)

	return prediction
}

func getRecentChecks(checks []*models.HealthCheck, window time.Duration) []*models.HealthCheck {
	now := time.Now().UTC()
	cutoff := now.Add(-window)
	
	var recent []*models.HealthCheck
	for _, check := range checks {
		if check.CheckedAt.After(cutoff) {
			recent = append(recent, check)
		}
	}
	return recent
}

// analyzeResponseTimeTrend analyzes response time trends
func analyzeResponseTimeTrend(checks []*models.HealthCheck) string {
	if len(checks) < 2 {
		return "stable"
	}

	// Get response times (skip nil values)
	var times []float64
	for _, check := range checks {
		if check.ResponseTimeMs != nil {
			times = append(times, float64(*check.ResponseTimeMs))
		}
	}

	if len(times) < 2 {
		return "stable"
	}

	firstHalf := times[:len(times)/2]
	secondHalf := times[len(times)/2:]
	
	avgFirst := average(firstHalf)
	avgSecond := average(secondHalf)
	
	changePercent := ((avgSecond - avgFirst) / avgFirst) * 100

	if changePercent > 50 {
		return "increasing"
	} else if changePercent < -30 {
		return "decreasing"
	}
	return "stable"
}

func analyzeStatusPattern(checks []*models.HealthCheck) map[string]int {
	pattern := make(map[string]int)
	for _, check := range checks {
		pattern[check.Status]++
	}
	return pattern
}

func calculateFailureRate(checks []*models.HealthCheck) float64 {
	if len(checks) == 0 {
		return 0
	}
	
	downCount := 0
	for _, check := range checks {
		if check.Status == "down" {
			downCount++
		}
	}
	
	return float64(downCount) / float64(len(checks))
}

// detectAnomalies detects anomalies in the data
func detectAnomalies(checks []*models.HealthCheck) []string {
	var anomalies []string
	
	// Get response times
	var times []float64
	for _, check := range checks {
		if check.ResponseTimeMs != nil {
			times = append(times, float64(*check.ResponseTimeMs))
		}
	}
	
	if len(times) < 3 {
		return anomalies
	}
	
	mean := average(times)
	stdDev := standardDeviation(times, mean)
	
	// Detect outliers (values > 2 standard deviations from mean)
	for i, check := range checks {
		if check.ResponseTimeMs != nil {
			value := float64(*check.ResponseTimeMs)
			if math.Abs(value-mean) > 2*stdDev {
				anomalies = append(anomalies, check.CheckedAt.Format("15:04"))
			}
		}
		// Check for status anomalies
		if i > 0 && checks[i-1].Status == "up" && check.Status == "down" {
			anomalies = append(anomalies, "status_change_"+check.CheckedAt.Format("15:04"))
		}
	}
	
	return anomalies
}

// generatePrediction generates a prediction based on analysis
func (p *Predictor) generatePrediction(
	service *models.Service,
	responseTimeTrend string,
	statusPattern map[string]int,
	failureRate float64,
	anomalies []string,
	recentChecks []*models.HealthCheck,
) *Prediction {
	riskLevel := "low"
	confidence := 0.3
	predictedIssue := "No issues predicted"
	timeWindow := "within 24 hours"
	reason := "Service appears stable"
	recommendedAction := "Continue monitoring"

	// High failure rate indicates immediate risk
	if failureRate > 0.3 {
		riskLevel = "critical"
		confidence = 0.9
		timeWindow = "imminent"
	} else if failureRate > 0.1 {
		riskLevel = "high"
		confidence = 0.75
		timeWindow = "within 1 hour"
	} else if responseTimeTrend == "increasing" {
		// Increasing response times
		riskLevel = "medium"
		confidence = 0.65
		timeWindow = "within 4 hours"
	} else if len(anomalies) > 3 {
		// Multiple anomalies detected
		riskLevel = "medium"
		confidence = 0.6
		timeWindow = "within 6 hours"
	} else if statusPattern["down"] > 0 && len(recentChecks) > 10 {
		// Some failures but not critical
		riskLevel = "low"
		confidence = 0.5
		timeWindow = "within 12 hours"
	}

	// Try to use OpenAI for natural language generation if available
	if p.openAIClient != nil && riskLevel != "low" {
		// Aggregate metrics for OpenAI
		metrics := aggregateMetrics(service, recentChecks, 24*time.Hour)
		metrics.RiskLevel = riskLevel
		metrics.Confidence = confidence

		// Call OpenAI to generate natural language descriptions
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		openAIResponse, err := p.openAIClient.GeneratePredictionText(ctx, metrics)
		if err != nil {
			// Log warning but fall back to default descriptions
			log.Printf("Warning: OpenAI prediction generation failed: %v. Falling back to default descriptions.", err)
		} else {
			// Use OpenAI-generated descriptions
			predictedIssue = openAIResponse.PredictedIssue
			reason = openAIResponse.Reason
			recommendedAction = openAIResponse.RecommendedAction
		}
	}

	// Fallback to default descriptions if OpenAI wasn't used or failed
	if predictedIssue == "No issues predicted" {
		if failureRate > 0.3 {
			predictedIssue = "High failure rate detected - potential service outage"
			reason = "Failure rate exceeds 30% in recent checks"
			recommendedAction = "Investigate immediately and check service logs"
		} else if failureRate > 0.1 {
			predictedIssue = "Elevated failure rate - service degradation likely"
			reason = "Failure rate is above 10%"
			recommendedAction = "Review service health and prepare for potential issues"
		} else if responseTimeTrend == "increasing" {
			predictedIssue = "Response time degradation detected"
			reason = "Response times are trending upward significantly"
			recommendedAction = "Monitor response times closely and check for resource constraints"
		} else if len(anomalies) > 3 {
			predictedIssue = "Multiple anomalies detected in service metrics"
			reason = "Unusual patterns detected in response times and status changes"
			recommendedAction = "Review recent changes and system load"
		} else if statusPattern["down"] > 0 && len(recentChecks) > 10 {
			predictedIssue = "Intermittent failures detected"
			reason = "Occasional failures observed in recent checks"
			recommendedAction = "Continue monitoring and investigate root cause"
		}
	}

	return &Prediction{
		ServiceID:        service.ID.String(),
		ServiceName:      service.Name,
		RiskLevel:        riskLevel,
		Confidence:       confidence,
		PredictedIssue:   predictedIssue,
		TimeWindow:       timeWindow,
		Reason:           reason,
		RecommendedAction: recommendedAction,
		PredictedAt:      time.Now().UTC(),
	}
}

// Helper functions
func average(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	sum := 0.0
	for _, v := range values {
		sum += v
	}
	return sum / float64(len(values))
}

func standardDeviation(values []float64, mean float64) float64 {
	if len(values) < 2 {
		return 0
	}
	
	sumSquaredDiff := 0.0
	for _, v := range values {
		diff := v - mean
		sumSquaredDiff += diff * diff
	}
	
	variance := sumSquaredDiff / float64(len(values))
	return math.Sqrt(variance)
}

// aggregateMetrics aggregates health check data into structured metrics for OpenAI
func aggregateMetrics(service *models.Service, checks []*models.HealthCheck, timeWindow time.Duration) AggregatedMetrics {
	now := time.Now().UTC()
	cutoff := now.Add(-timeWindow)
	
	var recentChecks []*models.HealthCheck
	for _, check := range checks {
		if check.CheckedAt.After(cutoff) {
			recentChecks = append(recentChecks, check)
		}
	}
	
	// Calculate aggregated metrics
	totalChecks := len(recentChecks)
	failureRate := calculateFailureRate(recentChecks)
	statusBreakdown := analyzeStatusPattern(recentChecks)
	responseTimeTrend := analyzeResponseTimeTrend(recentChecks)
	anomalies := detectAnomalies(recentChecks)
	
	// Calculate average response time
	var responseTimes []float64
	for _, check := range recentChecks {
		if check.ResponseTimeMs != nil {
			responseTimes = append(responseTimes, float64(*check.ResponseTimeMs))
		}
	}
	avgResponseTime := average(responseTimes)
	
	// Format time window
	timeWindowStr := formatTimeWindow(timeWindow)
	
	// Format anomaly details (limit to 5 most recent)
	anomalyDetails := anomalies
	if len(anomalyDetails) > 5 {
		anomalyDetails = anomalyDetails[len(anomalyDetails)-5:]
	}
	
	return AggregatedMetrics{
		ServiceName:        service.Name,
		ServiceType:        service.Type,
		ServiceURL:         service.URL,
		TimeWindow:         timeWindowStr,
		TotalChecks:        totalChecks,
		FailureRate:        failureRate,
		AverageResponseTime: avgResponseTime,
		ResponseTimeTrend:   responseTimeTrend,
		StatusBreakdown:     statusBreakdown,
		AnomalyCount:        len(anomalies),
		AnomalyDetails:      anomalyDetails,
	}
}

// formatTimeWindow formats a duration into a human-readable string
func formatTimeWindow(window time.Duration) string {
	hours := int(window.Hours())
	if hours < 1 {
		minutes := int(window.Minutes())
		return fmt.Sprintf("Last %d minutes", minutes)
	} else if hours < 24 {
		return fmt.Sprintf("Last %d hours", hours)
	} else {
		days := hours / 24
		return fmt.Sprintf("Last %d days", days)
	}
}

