package ai

import (
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

// Predictor analyzes historical health check data to predict potential incidents
type Predictor struct{}

func NewPredictor() *Predictor {
	return &Predictor{}
}

// AnalyzeService analyzes historical health check data for a service and generates predictions
func (p *Predictor) AnalyzeService(service *models.Service, healthChecks []*models.HealthCheck) *Prediction {
	if len(healthChecks) < 10 {
		// Not enough data for meaningful prediction
		return nil
	}

	// Calculate trends and patterns
	recentChecks := getRecentChecks(healthChecks, 24*time.Hour)
	if len(recentChecks) < 5 {
		return nil
	}

	// Analyze response time trends
	responseTimeTrend := analyzeResponseTimeTrend(recentChecks)
	
	// Analyze status patterns
	statusPattern := analyzeStatusPattern(recentChecks)
	
	// Calculate failure rate
	failureRate := calculateFailureRate(recentChecks)
	
	// Detect anomalies
	anomalies := detectAnomalies(recentChecks)
	
	// Generate prediction based on analysis
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

// getRecentChecks filters health checks within the specified time window
func getRecentChecks(checks []*models.HealthCheck, window time.Duration) []*models.HealthCheck {
	now := time.Now()
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

	// Calculate trend (simple linear regression slope)
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

// analyzeStatusPattern analyzes status patterns for degradation
func analyzeStatusPattern(checks []*models.HealthCheck) map[string]int {
	pattern := make(map[string]int)
	for _, check := range checks {
		pattern[check.Status]++
	}
	return pattern
}

// calculateFailureRate calculates the failure rate
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
		predictedIssue = "High failure rate detected - potential service outage"
		timeWindow = "imminent"
		reason = "Failure rate exceeds 30% in recent checks"
		recommendedAction = "Investigate immediately and check service logs"
	} else if failureRate > 0.1 {
		riskLevel = "high"
		confidence = 0.75
		predictedIssue = "Elevated failure rate - service degradation likely"
		timeWindow = "within 1 hour"
		reason = "Failure rate is above 10%"
		recommendedAction = "Review service health and prepare for potential issues"
	} else if responseTimeTrend == "increasing" {
		// Increasing response times
		riskLevel = "medium"
		confidence = 0.65
		predictedIssue = "Response time degradation detected"
		timeWindow = "within 4 hours"
		reason = "Response times are trending upward significantly"
		recommendedAction = "Monitor response times closely and check for resource constraints"
	} else if len(anomalies) > 3 {
		// Multiple anomalies detected
		riskLevel = "medium"
		confidence = 0.6
		predictedIssue = "Multiple anomalies detected in service metrics"
		timeWindow = "within 6 hours"
		reason = "Unusual patterns detected in response times and status changes"
		recommendedAction = "Review recent changes and system load"
	} else if statusPattern["down"] > 0 && len(recentChecks) > 10 {
		// Some failures but not critical
		riskLevel = "low"
		confidence = 0.5
		predictedIssue = "Intermittent failures detected"
		timeWindow = "within 12 hours"
		reason = "Occasional failures observed in recent checks"
		recommendedAction = "Continue monitoring and investigate root cause"
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
		PredictedAt:      time.Now(),
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

