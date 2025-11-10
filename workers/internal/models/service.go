package models

type Service struct {
	ID                string
	OrganizationID    string
	Name              string
	URL               string
	Type              string
	CheckInterval     int
	Timeout           int
	ExpectedStatusCode *int
}

