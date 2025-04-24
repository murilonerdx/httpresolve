package com.murilo_pereira.httpresolve.strategy;


import com.murilo_pereira.httpresolve.exception.RateLimitException;

/**
 * Strategy interface for rate limiter implementations
 */
public interface RateLimitStrategy {
	/**
	 * Attempts to consume a token from the rate limiter
	 * @throws RateLimitException if rate limit is exceeded
	 */
	void consumePermission() throws RateLimitException;

	/**
	 * Gets the current usage statistics
	 * @return current usage status
	 */
	RateLimitMetrics getMetrics();

	/**
	 * Statistics about the rate limiter
	 */
	class RateLimitMetrics {
		private final int available;
		private final int limit;
		private final long windowDurationMillis;
		private final long remainingWindowMillis;

		public RateLimitMetrics(int available, int limit, long windowDurationMillis, long remainingWindowMillis) {
			this.available = available;
			this.limit = limit;
			this.windowDurationMillis = windowDurationMillis;
			this.remainingWindowMillis = remainingWindowMillis;
		}

		// Getters
		public int getAvailable() {
			return available;
		}

		public int getLimit() {
			return limit;
		}

		public long getWindowDurationMillis() {
			return windowDurationMillis;
		}

		public long getRemainingWindowMillis() {
			return remainingWindowMillis;
		}
	}
}

