package utils

import (
	"fmt"
	"net"
	"regexp"
	"strings"
	"time"
)

var (
	// Email format regex - RFC 5322 compliant (simplified)
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
)

// ValidateEmail performs comprehensive email validation:
// 1. Format validation
// 2. DNS/MX record check
// 3. Disposable email check
func ValidateEmail(email string) error {
	email = strings.TrimSpace(strings.ToLower(email))

	// Step 1: Format validation
	if !emailRegex.MatchString(email) {
		return fmt.Errorf("invalid email format")
	}

	// Step 2: Check for disposable email
	if IsDisposableEmail(email) {
		return fmt.Errorf("disposable email addresses are not allowed")
	}

	// Step 3: DNS/MX record check
	if err := checkMXRecord(email); err != nil {
		return fmt.Errorf("email domain does not have valid mail servers: %v", err)
	}

	return nil
}

// checkMXRecord verifies that the email domain has valid MX (Mail Exchange) records
// This ensures the domain can actually receive emails
func checkMXRecord(email string) error {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return fmt.Errorf("invalid email format")
	}

	domain := parts[1]

	// Check MX records first (preferred)
	mxRecords, err := net.LookupMX(domain)
	if err == nil && len(mxRecords) > 0 {
		// Domain has MX records - valid
		return nil
	}

	// If no MX records, check if domain has A/AAAA records
	// Some domains use A records for mail delivery (though not recommended)
	_, err = net.LookupHost(domain)
	if err == nil {
		// Domain exists and has A/AAAA records
		// This is acceptable as a fallback (some mail servers use A records)
		return nil
	}

	// Domain doesn't have MX or A records - likely invalid
	return fmt.Errorf("domain %s does not have valid mail servers", domain)
}

// ValidateEmailWithTimeout performs email validation with a timeout
// Useful for production to avoid hanging on slow DNS lookups
func ValidateEmailWithTimeout(email string, timeout time.Duration) error {
	email = strings.TrimSpace(strings.ToLower(email))

	// Step 1: Format validation (fast, no timeout needed)
	if !emailRegex.MatchString(email) {
		return fmt.Errorf("invalid email format")
	}

	// Step 2: Check for disposable email (fast, no timeout needed)
	if IsDisposableEmail(email) {
		return fmt.Errorf("disposable email addresses are not allowed")
	}

	// Step 3: DNS/MX record check with timeout
	done := make(chan error, 1)
	go func() {
		done <- checkMXRecord(email)
	}()

	select {
	case err := <-done:
		return err
	case <-time.After(timeout):
		// DNS lookup timed out - log warning but don't block registration
		// In production, you might want to be more strict
		return fmt.Errorf("email domain validation timed out - please try again")
	}
}

