package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server      ServerConfig
	Database    DatabaseConfig
	JWT         JWTConfig
	AWS         AWSConfig
	HealthCheck HealthCheckConfig
	CORS        CORSConfig
	OpenAI      OpenAIConfig
	Ollama      OllamaConfig
}

type ServerConfig struct {
	Port string
	Env  string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

type JWTConfig struct {
	Secret string
	Expiry time.Duration
}

type AWSConfig struct {
	Region          string
	AccessKeyID     string
	SecretAccessKey string
	SNSTopicARN     string
	SESFromEmail    string
}

type SMTPConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	FromEmail string
}

type HealthCheckConfig struct {
	Interval   int
	Timeout    int
}

type CORSConfig struct {
	Origin string
}

type OpenAIConfig struct {
	APIKey  string
	Model   string
	Enabled bool
	Timeout time.Duration
}

type OllamaConfig struct {
	BaseURL string
	Model   string
	Enabled bool
	Timeout time.Duration
}

func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	// Parse JWT expiry
	jwtExpiry := "24h"
	if exp := os.Getenv("JWT_EXPIRY"); exp != "" {
		jwtExpiry = exp
	}
	expiry, _ := time.ParseDuration(jwtExpiry)

	cfg := &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "8080"),
			Env:  getEnv("ENV", "development"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			Name:     getEnv("DB_NAME", "pulsegrid"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", "change-me-in-production"),
			Expiry: expiry,
		},
		AWS: AWSConfig{
			Region:          getEnv("AWS_REGION", "us-east-1"),
			AccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
			SecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
			SNSTopicARN:     getEnv("SNS_TOPIC_ARN", ""),
			SESFromEmail:    getEnv("SES_FROM_EMAIL", "noreply@pulsegrid.com"),
		},
		HealthCheck: HealthCheckConfig{
			Interval: getEnvInt("HEALTH_CHECK_INTERVAL", 60),
			Timeout:  getEnvInt("DEFAULT_TIMEOUT", 10),
		},
		CORS: CORSConfig{
			Origin: getEnv("CORS_ORIGIN", "http://localhost:3000"),
		},
		OpenAI: LoadOpenAIConfig(),
		Ollama: LoadOllamaConfig(),
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if result, err := strconv.Atoi(value); err == nil {
			return result
		}
	}
	return defaultValue
}

// LoadOpenAIConfig loads OpenAI configuration from environment variables
// In production (ECS), the OPENAI_API_KEY is automatically injected from SSM Parameter Store
// by ECS task definition. In local development, it reads from .env file.
func LoadOpenAIConfig() OpenAIConfig {
	apiKey := getEnv("OPENAI_API_KEY", "")
	model := getEnv("OPENAI_MODEL", "gpt-3.5-turbo")
	timeoutStr := getEnv("OPENAI_TIMEOUT", "10s")
	
	timeout, err := time.ParseDuration(timeoutStr)
	if err != nil {
		timeout = 10 * time.Second
	}

	enabled := apiKey != ""

	return OpenAIConfig{
		APIKey:  apiKey,
		Model:   model,
		Enabled: enabled,
		Timeout: timeout,
	}
}

// LoadOllamaConfig loads Ollama configuration from environment variables
func LoadOllamaConfig() OllamaConfig {
	baseURL := getEnv("OLLAMA_BASE_URL", "http://localhost:11434")
	model := getEnv("OLLAMA_MODEL", "llama2")
	timeoutStr := getEnv("OLLAMA_TIMEOUT", "30s")
	
	timeout, err := time.ParseDuration(timeoutStr)
	if err != nil {
		timeout = 30 * time.Second
	}

	enabled := getEnv("OLLAMA_ENABLED", "false") == "true" || getEnv("USE_OLLAMA", "false") == "true"

	return OllamaConfig{
		BaseURL: baseURL,
		Model:   model,
		Enabled: enabled,
		Timeout: timeout,
	}
}

