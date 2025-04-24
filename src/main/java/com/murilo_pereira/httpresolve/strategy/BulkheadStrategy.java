package com.murilo_pereira.httpresolve.strategy;


import com.murilo_pereira.httpresolve.exception.BulkheadException;

/**
 * Strategy interface for bulkhead implementations
 */
public interface BulkheadStrategy {
	/**
	 * Attempts to acquire a permit
	 * @throws BulkheadException if the bulkhead is full
	 */
	void acquirePermission() throws BulkheadException;

	/**
	 * Releases a permit
	 */
	void releasePermission();

	/**
	 * Gets the current usage statistics
	 * @return current usage status
	 */
	BulkheadMetrics getMetrics();

	/**
	 * Statistics about the bulkhead
	 */
	class BulkheadMetrics {
		private final int available;
		private final int maxConcurrentCalls;
		private final int queueSize;
		private final int queueCapacity;

		public BulkheadMetrics(int available, int maxConcurrentCalls, int queueSize, int queueCapacity) {
			this.available = available;
			this.maxConcurrentCalls = maxConcurrentCalls;
			this.queueSize = queueSize;
			this.queueCapacity = queueCapacity;
		}

		// Getters
		public int getAvailable() {
			return available;
		}

		public int getMaxConcurrentCalls() {
			return maxConcurrentCalls;
		}

		public int getQueueSize() {
			return queueSize;
		}

		public int getQueueCapacity() {
			return queueCapacity;
		}
	}
}

