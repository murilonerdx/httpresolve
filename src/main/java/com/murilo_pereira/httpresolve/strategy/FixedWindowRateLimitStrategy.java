package com.murilo_pereira.httpresolve.strategy;



import com.murilo_pereira.httpresolve.config.BulkheadRateLimitProperties;
import com.murilo_pereira.httpresolve.exception.RateLimitException;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Fixed Window Rate Limiter Implementation
 */
public class FixedWindowRateLimitStrategy implements RateLimitStrategy {
	private final int limit;
	private final long windowMillis;
	private final AtomicInteger counter = new AtomicInteger(0);
	private final AtomicLong windowStartTime = new AtomicLong(System.currentTimeMillis());

	public FixedWindowRateLimitStrategy(BulkheadRateLimitProperties.RateLimitConfig config) {
		this.limit = config.getLimit();
		this.windowMillis = config.getWindow().toMillis();
	}

	@Override
	public synchronized void consumePermission() throws RateLimitException {
		long now = System.currentTimeMillis();
		long windowStart = windowStartTime.get();

		// Check if we need to reset the window
		if (now - windowStart > windowMillis) {
			windowStartTime.set(now);
			counter.set(0);
		}

		// Check if rate limit is reached
		if (counter.incrementAndGet() > limit) {
			throw new RateLimitException("Rate limit exceeded");
		}
	}

	@Override
	public RateLimitMetrics getMetrics() {
		long now = System.currentTimeMillis();
		long windowStart = windowStartTime.get();

		// If window has expired, we show full availability
		if (now - windowStart > windowMillis) {
			return new RateLimitMetrics(
					limit,
					limit,
					windowMillis,
					0
			);
		}

		int used = counter.get();
		int available = Math.max(0, limit - used);
		long remainingMillis = Math.max(0, windowMillis - (now - windowStart));

		return new RateLimitMetrics(
				available,
				limit,
				windowMillis,
				remainingMillis
		);
	}
}
