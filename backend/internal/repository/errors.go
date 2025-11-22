package repository

import "errors"

var (
	// ErrNotFound is returned when a record is not found
	ErrNotFound = errors.New("record not found")
	
	// ErrDuplicateEntry is returned when trying to create a duplicate record
	ErrDuplicateEntry = errors.New("duplicate entry")
	
	// ErrInvalidInput is returned when input validation fails
	ErrInvalidInput = errors.New("invalid input")
)





