package com.murilo_pereira.httpresolve.exception;

/**
 * Exception thrown when rate limit is exceeded
 */
public class RateLimitException extends RuntimeException {
	public RateLimitException(String message) {
		super(message);
	}

	public RateLimitException(String message, Throwable cause) {
		super(message, cause);
	}
}
