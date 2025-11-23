package handlers

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"pulsegrid/backend/internal/checker"
	"github.com/gin-gonic/gin"
)

// Cache entry for storing health check results
type cacheEntry struct {
	result    *checker.HealthCheckResult
	timestamp time.Time
}

// In-memory cache for status checks (use Redis in production for distributed systems)
var (
	statusCache = make(map[string]*cacheEntry)
	cacheMutex  sync.RWMutex
	cacheTTL    = 30 * time.Second // Cache results for 30 seconds
)

// Rate limiting storage (use Redis in production for distributed systems)
var (
	rateLimitMap    = make(map[string][]time.Time)
	rateLimitMutex  sync.RWMutex
	maxRequests     = 60              // 60 requests per minute
	rateLimitWindow = 1 * time.Minute // 1 minute window
)

// IP blocking and violation tracking
var (
	blockedIPs      = make(map[string]time.Time) // IP -> unblock time
	blockedIPsMutex sync.RWMutex
	violationCount  = make(map[string]int) // IP -> violation count
	violationMutex  sync.RWMutex
	maxViolations   = 3 // Max violations before temporary ban
	banDuration     = 1 * time.Hour // Temporary ban duration
)

// Usage pattern tracking for monitoring
type usagePattern struct {
	IP           string
	RequestCount int
	UniqueURLs   map[string]int
	Violations   int
	LastRequest  time.Time
	UserAgent    string
}

var (
	usagePatterns = make(map[string]*usagePattern)
	usageMutex    sync.RWMutex
)

// CheckPublicStatus handles public status check requests
// GET /api/v1/public/status?url=https://api.example.com
func CheckPublicStatus(c *gin.Context) {
	clientIP := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// Check if IP is blocked
	if isIPBlocked(clientIP) {
		c.Header("X-API-Usage-Policy", "Acceptable use only. See /docs#publicAPI for guidelines")
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "IP address is temporarily blocked due to API misuse.",
			"contact": "support@pulsegrid.com for appeals",
		})
		return
	}

	// Track user agent for suspicious pattern detection
	trackUserAgent(clientIP, userAgent)

	// Get URL from query parameter
	targetURL := c.Query("url")
	if targetURL == "" {
		c.Header("X-API-Usage-Policy", "Acceptable use only. See /docs#publicAPI for guidelines")
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Missing required parameter: url",
			"example": "/api/v1/public/status?url=https://api.paystack.com",
		})
		return
	}

	// Validate URL
	parsedURL, err := url.Parse(targetURL)
	if err != nil || parsedURL.Scheme == "" || parsedURL.Host == "" {
		c.Header("X-API-Usage-Policy", "Acceptable use only. See /docs#publicAPI for guidelines")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid URL format. Please provide a valid HTTP or HTTPS URL.",
		})
		return
	}

	// Security: Prevent SSRF attacks (only allow http/https)
	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		c.Header("X-API-Usage-Policy", "Acceptable use only. See /docs#publicAPI for guidelines")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Only HTTP and HTTPS URLs are allowed",
		})
		return
	}

	// Additional security: Prevent localhost/internal network access
	host := parsedURL.Hostname()
	if isLocalhost(host) || isPrivateIP(host) {
		c.Header("X-API-Usage-Policy", "Acceptable use only. See /docs#publicAPI for guidelines")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Localhost and private network addresses are not allowed for security reasons",
		})
		return
	}

	// Rate limiting with progressive penalties
	remaining, resetTime := checkRateLimitWithInfo(clientIP)
	if remaining < 0 {
		// Rate limit exceeded - handle violations
		violations := getViolationCount(clientIP)
		incrementViolation(clientIP)

		// Progressive penalties
		if violations >= maxViolations-1 {
			// Temporary ban
			blockIP(clientIP, banDuration)
			c.Header("X-API-Usage-Policy", "Acceptable use only. See /docs#publicAPI for guidelines")
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "IP temporarily banned due to repeated rate limit violations. Ban expires in 1 hour.",
				"retry_after": int(banDuration.Seconds()),
				"contact":     "support@pulsegrid.com for appeals",
			})
			log.Printf("API Abuse: IP %s temporarily banned due to %d violations", clientIP, violations+1)
			return
		}

		c.Header("X-API-Usage-Policy", "Acceptable use only. See /docs#publicAPI for guidelines")
		c.Header("X-Rate-Limit-Remaining", "0")
		c.Header("X-Rate-Limit-Reset", fmt.Sprintf("%d", resetTime))
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":       "Rate limit exceeded. Maximum 60 requests per minute per IP address.",
			"retry_after": 60,
			"warning":     fmt.Sprintf("Violation %d/%d. Repeated violations may result in IP blocking.", violations+1, maxViolations),
		})
		return
	}

	// Reset violation count on successful request (if no recent violations)
	if getViolationCount(clientIP) > 0 {
		// Reset after 5 minutes of good behavior
		go func() {
			time.Sleep(5 * time.Minute)
			resetViolationCount(clientIP)
		}()
	}

	// Track usage pattern
	trackUsagePattern(clientIP, targetURL, userAgent)

	// Check cache first
	cacheKey := targetURL
	if cached := getFromCache(cacheKey); cached != nil {
		c.Header("X-API-Usage-Policy", "Acceptable use only. See /docs#publicAPI for guidelines")
		c.Header("X-Rate-Limit-Remaining", fmt.Sprintf("%d", remaining))
		c.Header("X-Rate-Limit-Reset", fmt.Sprintf("%d", resetTime))
		c.JSON(http.StatusOK, gin.H{
			"url":             targetURL,
			"status":          cached.Status,
			"response_time_ms": cached.ResponseTimeMs,
			"status_code":     cached.StatusCode,
			"error_message":   cached.ErrorMessage,
			"checked_at":      time.Now().UTC().Format(time.RFC3339),
			"cached":           true,
			"service": gin.H{
				"name":    "PulseGrid",
				"version": "1.0.0",
				"docs":    "https://pulsegrid.com/docs#api",
			},
			"usage_note":      "This API is for legitimate service health checks only. See /docs#publicAPI for usage guidelines.",
		})
		return
	}

	// Perform health check with 10 second timeout
	timeout := 10 * time.Second
	result := checker.CheckHTTP(targetURL, timeout, nil)

	// Store in cache
	setCache(cacheKey, result)

	// Return response with headers and usage note
	c.Header("X-API-Usage-Policy", "Acceptable use only. See /docs#publicAPI for guidelines")
	c.Header("X-Rate-Limit-Remaining", fmt.Sprintf("%d", remaining))
	c.Header("X-Rate-Limit-Reset", fmt.Sprintf("%d", resetTime))
	c.JSON(http.StatusOK, gin.H{
		"url":             targetURL,
		"status":          result.Status,
		"response_time_ms": result.ResponseTimeMs,
		"status_code":     result.StatusCode,
		"error_message":   result.ErrorMessage,
		"checked_at":      time.Now().Format(time.RFC3339),
		"cached":          false,
		"service": gin.H{
			"name":    "PulseGrid",
			"version": "1.0.0",
			"docs":    "https://pulsegrid.com/docs#api",
		},
		"usage_note":      "This API is for legitimate service health checks only. See /docs#publicAPI for usage guidelines.",
	})
}

// getFromCache retrieves a cached result if it exists and hasn't expired
func getFromCache(key string) *checker.HealthCheckResult {
	cacheMutex.RLock()
	defer cacheMutex.RUnlock()

	entry, exists := statusCache[key]
	if !exists {
		return nil
	}

	// Check if cache entry has expired
	if time.Since(entry.timestamp) > cacheTTL {
		return nil // Cache expired
	}

	return entry.result
}

// setCache stores a result in the cache
func setCache(key string, result *checker.HealthCheckResult) {
	cacheMutex.Lock()
	defer cacheMutex.Unlock()

	statusCache[key] = &cacheEntry{
		result:    result,
		timestamp: time.Now().UTC(),
	}

	// Simple cache cleanup: remove entries older than 5 minutes to prevent memory leak
	// In production, use Redis with TTL or a proper cache eviction strategy
	go func() {
		time.Sleep(5 * time.Minute)
		cacheMutex.Lock()
		defer cacheMutex.Unlock()
		for k, v := range statusCache {
			if time.Since(v.timestamp) > 5*time.Minute {
				delete(statusCache, k)
			}
		}
	}()
}

// checkRateLimit verifies if the client IP has exceeded the rate limit
func checkRateLimit(ip string) bool {
	remaining, _ := checkRateLimitWithInfo(ip)
	return remaining >= 0
}

// checkRateLimitWithInfo returns remaining requests and reset time
func checkRateLimitWithInfo(ip string) (int, int64) {
	rateLimitMutex.Lock()
	defer rateLimitMutex.Unlock()

	now := time.Now()
	requests := rateLimitMap[ip]

	// Remove old requests outside the window
	validRequests := []time.Time{}
	for _, reqTime := range requests {
		if now.Sub(reqTime) < rateLimitWindow {
			validRequests = append(validRequests, reqTime)
		}
	}

	// Calculate remaining requests
	remaining := maxRequests - len(validRequests)

	// Calculate reset time (when the oldest request expires)
	var resetTime int64
	if len(validRequests) > 0 {
		oldestRequest := validRequests[0]
		resetTime = oldestRequest.Add(rateLimitWindow).Unix()
	} else {
		resetTime = now.Add(rateLimitWindow).Unix()
	}

	// Check if rate limit exceeded
	if len(validRequests) >= maxRequests {
		return -1, resetTime // Rate limit exceeded
	}

	// Add current request
	validRequests = append(validRequests, now)
	rateLimitMap[ip] = validRequests

	// Cleanup old entries periodically to prevent memory leak
	// In production, use Redis with TTL
	if len(rateLimitMap) > 10000 {
		go cleanupRateLimitMap()
	}

	return remaining, resetTime
}

// cleanupRateLimitMap removes old rate limit entries
func cleanupRateLimitMap() {
	rateLimitMutex.Lock()
	defer rateLimitMutex.Unlock()

	now := time.Now()
	for ip, requests := range rateLimitMap {
		validRequests := []time.Time{}
		for _, reqTime := range requests {
			if now.Sub(reqTime) < rateLimitWindow {
				validRequests = append(validRequests, reqTime)
			}
		}
		if len(validRequests) == 0 {
			delete(rateLimitMap, ip)
		} else {
			rateLimitMap[ip] = validRequests
		}
	}
}

// isLocalhost checks if the hostname is localhost
func isLocalhost(host string) bool {
	return host == "localhost" || host == "127.0.0.1" || host == "::1" || host == "0.0.0.0"
}

// isPrivateIP checks if the hostname is a private IP address
// This is a simplified check - in production, use a proper IP parsing library
func isPrivateIP(host string) bool {
	// Check for common private IP patterns
	privatePatterns := []string{
		"10.",
		"172.16.",
		"172.17.",
		"172.18.",
		"172.19.",
		"172.20.",
		"172.21.",
		"172.22.",
		"172.23.",
		"172.24.",
		"172.25.",
		"172.26.",
		"172.27.",
		"172.28.",
		"172.29.",
		"172.30.",
		"172.31.",
		"192.168.",
		"169.254.",
	}
	
	for _, pattern := range privatePatterns {
		if len(host) >= len(pattern) && host[:len(pattern)] == pattern {
			return true
		}
	}
	return false
}

// isIPBlocked checks if an IP address is currently blocked
func isIPBlocked(ip string) bool {
	blockedIPsMutex.RLock()
	defer blockedIPsMutex.RUnlock()

	unblockTime, exists := blockedIPs[ip]
	if !exists {
		return false
	}

	if time.Now().After(unblockTime) {
		// Unblock expired - remove from map
		blockedIPsMutex.RUnlock()
		blockedIPsMutex.Lock()
		delete(blockedIPs, ip)
		blockedIPsMutex.Unlock()
		blockedIPsMutex.RLock()
		return false
	}

	return true
}

// blockIP temporarily blocks an IP address
func blockIP(ip string, duration time.Duration) {
	blockedIPsMutex.Lock()
	defer blockedIPsMutex.Unlock()

	blockedIPs[ip] = time.Now().Add(duration)
	log.Printf("IP %s blocked until %s", ip, blockedIPs[ip].Format(time.RFC3339))
}

// getViolationCount returns the number of violations for an IP
func getViolationCount(ip string) int {
	violationMutex.RLock()
	defer violationMutex.RUnlock()
	return violationCount[ip]
}

// incrementViolation increments the violation count for an IP
func incrementViolation(ip string) {
	violationMutex.Lock()
	defer violationMutex.Unlock()
	violationCount[ip]++
	log.Printf("Violation count for IP %s: %d", ip, violationCount[ip])
}

// resetViolationCount resets the violation count for an IP
func resetViolationCount(ip string) {
	violationMutex.Lock()
	defer violationMutex.Unlock()
	delete(violationCount, ip)
	log.Printf("Violation count reset for IP %s", ip)
}

// trackUserAgent logs suspicious user agents for monitoring
func trackUserAgent(ip, userAgent string) {
	if userAgent == "" {
		return
	}

	// Flag suspicious patterns
	suspiciousPatterns := []string{
		"bot", "crawler", "scraper", "spider",
		"curl/", "wget", "python-requests",
		"go-http-client", "java/", "okhttp",
	}

	userAgentLower := strings.ToLower(userAgent)
	for _, pattern := range suspiciousPatterns {
		if strings.Contains(userAgentLower, pattern) {
			log.Printf("Suspicious user agent detected: %s from IP: %s", userAgent, ip)
			break
		}
	}
}

// trackUsagePattern tracks usage patterns for monitoring
func trackUsagePattern(ip, targetURL, userAgent string) {
	usageMutex.Lock()
	defer usageMutex.Unlock()

	pattern, exists := usagePatterns[ip]
	if !exists {
		pattern = &usagePattern{
			IP:         ip,
			UniqueURLs: make(map[string]int),
			UserAgent:  userAgent,
		}
		usagePatterns[ip] = pattern
	}

	pattern.RequestCount++
	pattern.UniqueURLs[targetURL]++
	pattern.LastRequest = time.Now()
	pattern.UserAgent = userAgent

	// Flag suspicious patterns
	// Too many unique URLs in short time (potential scraping)
	if len(pattern.UniqueURLs) > 50 && pattern.RequestCount > 100 {
		log.Printf("Potential scraping detected: IP %s checked %d unique URLs in %d requests", ip, len(pattern.UniqueURLs), pattern.RequestCount)
	}

	// Cleanup old patterns (older than 1 hour)
	if time.Since(pattern.LastRequest) > 1*time.Hour {
		delete(usagePatterns, ip)
	}
}

// GetPublicInfo returns information about the PulseGrid API service
func GetPublicInfo(c *gin.Context) {
	c.Header("X-API-Usage-Policy", "Acceptable use only. See /docs#publicAPI for guidelines")
	c.JSON(http.StatusOK, gin.H{
		"service":     "PulseGrid",
		"description": "Cloud-Native Infrastructure Monitoring Platform",
		"api_version": "1.0.0",
		"docs":        "https://pulsegrid.com/docs#api",
		"website":     "https://pulsegrid.com",
		"contact":     "support@pulsegrid.com",
		"features": []string{
			"Service health monitoring",
			"AI-powered predictions",
			"Multi-protocol support (HTTP, TCP, ICMP)",
			"Real-time alerts",
			"Public status API",
		},
		"endpoints": gin.H{
			"public_status": "/api/v1/public/status",
			"public_info":   "/api/v1/public/info",
		},
		"rate_limit": "60 requests per minute per IP",
		"cache_ttl":  "30 seconds",
	})
}

