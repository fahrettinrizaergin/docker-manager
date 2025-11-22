package utils

import (
	"strings"
)

// GenerateSlug creates a URL-friendly slug from a string
// Returns the slug or "untitled" if the result would be empty
func GenerateSlug(s string) string {
	// Trim whitespace
	s = strings.TrimSpace(s)

	// Return default if empty
	if s == "" {
		return "untitled"
	}

	// Convert to lowercase
	s = strings.ToLower(s)

	// Replace spaces with hyphens
	s = strings.ReplaceAll(s, " ", "-")

	// Remove special characters, keep only alphanumeric and hyphens
	var result strings.Builder
	prevHyphen := false

	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			result.WriteRune(r)
			prevHyphen = false
		} else if r == '-' && !prevHyphen && result.Len() > 0 {
			// Only add hyphen if previous character wasn't a hyphen
			// and result is not empty
			result.WriteRune(r)
			prevHyphen = true
		}
	}

	// Get the final slug
	slug := result.String()

	// Trim trailing hyphens
	slug = strings.TrimRight(slug, "-")

	// Return default if slug is empty after cleaning
	if slug == "" {
		return "untitled"
	}

	return slug
}
