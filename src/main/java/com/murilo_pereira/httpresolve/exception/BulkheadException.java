package com.murilo_pereira.httpresolve.exception;


/**
 * Exception thrown when bulkhead limit is exceeded
 */
public class BulkheadException extends RuntimeException {
	public BulkheadException(String message) {
		super(message);
	}

	public BulkheadException(String message, Throwable cause) {
		super(message, cause);
	}
}
