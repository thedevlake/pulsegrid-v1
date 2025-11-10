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

type HealthCheckConfig struct {
	Interval   int
	Timeout    int
}

type CORSConfig struct {
	Origin string
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

