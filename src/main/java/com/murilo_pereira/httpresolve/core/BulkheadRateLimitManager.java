package com.murilo_pereira.httpresolve.core;

import com.murilo_pereira.httpresolve.exception.BulkheadException;
import com.murilo_pereira.httpresolve.exception.BulkheadRateLimitException;
import com.murilo_pereira.httpresolve.exception.RateLimitException;
import com.murilo_pereira.httpresolve.metrics.BulkheadRateLimitMetrics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Main manager for executing methods with bulkhead and rate limit
 */
@Component
public class BulkheadRateLimitManager {
	private static final Logger log = LoggerFactory.getLogger(BulkheadRateLimitManager.class);

	private final BulkheadRateLimitRegistry registry;
	private final BulkheadRateLimitMetrics metrics;

	@Autowired
	public BulkheadRateLimitManager(BulkheadRateLimitRegistry registry, BulkheadRateLimitMetrics metrics) {
		this.registry = registry;
		this.metrics = metrics;
	}

	/**
	 * Executes a block of code with bulkhead and rate limiting applied
	 * @param policyName the policy name to use
	 * @param fallbackToDefault whether to use default policy if named policy not found
	 * @param executable the code to execute
	 * @return the result of the execution
	 * @throws BulkheadRateLimitException if limits are exceeded
	 * @throws Exception if the executable throws an exception
	 */
	public <T> T execute(String policyName, boolean fallbackToDefault, CheckedSupplier<T> executable)
			throws BulkheadRateLimitException, Exception {
		// Get limiter (by name or default)
		LimiterContext limiter = fallbackToDefault
				? registry.getLimiterOrDefault(policyName)
				: registry.getLimiter(policyName);

		boolean bulkheadAcquired = false;

		try {
			// Apply rate limit
			try {
				limiter.getRateLimit().consumePermission();
				metrics.recordRateLimitSuccess(policyName);
			} catch (RateLimitException e) {
				metrics.recordRateLimitRejected(policyName);
				throw new BulkheadRateLimitException("Rate limit exceeded for policy: " + policyName, e);
			}

			// Apply bulkhead
			try {
				limiter.getBulkhead().acquirePermission();
				bulkheadAcquired = true;
				metrics.recordBulkheadSuccess(policyName);
			} catch (BulkheadException e) {
				metrics.recordBulkheadRejected(policyName);
				throw new BulkheadRateLimitException("Bulkhead limit exceeded for policy: " + policyName, e);
			}

			// Execute the call
			try {
				return executable.get();
			} catch (Exception e) {
				metrics.recordExecutionError(policyName);
				throw e;
			}
		} finally {
			// Always release the bulkhead if acquired
			if (bulkheadAcquired) {
				limiter.getBulkhead().releasePermission();
			}
		}
	}

	/**
	 * Executes a block of code that doesn't return anything
	 */
	public void execute(String policyName, boolean fallbackToDefault, CheckedRunnable executable)
			throws BulkheadRateLimitException, Exception {
		execute(policyName, fallbackToDefault, () -> {
			executable.run();
			return null;
		});
	}

	/**
	 * Functional interface for code that returns a value and may throw exceptions
	 */
	@FunctionalInterface
	public interface CheckedSupplier<T> {
		T get() throws Exception;
	}

	/**
	 * Functional interface for code that doesn't return anything and may throw exceptions
	 */
	@FunctionalInterface
	public interface CheckedRunnable {
		void run() throws Exception;
	}
}
