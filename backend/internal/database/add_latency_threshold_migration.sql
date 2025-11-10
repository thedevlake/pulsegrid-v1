-- Migration: Add latency_threshold_ms column to services table
-- Run this if the column doesn't exist yet

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS latency_threshold_ms INTEGER DEFAULT NULL;

