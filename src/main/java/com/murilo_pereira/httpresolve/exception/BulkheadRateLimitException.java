package com.murilo_pereira.httpresolve.exception;

/**
 * Exception thrown when either bulkhead or rate limit constraints are violated
 */
public class BulkheadRateLimitException extends RuntimeException {
	public BulkheadRateLimitException(String message) {
		super(message);
	}

	public BulkheadRateLimitException(String message, Throwable cause) {
		super(message, cause);
	}
}
