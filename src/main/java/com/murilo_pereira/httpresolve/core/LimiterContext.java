package com.murilo_pereira.httpresolve.core;


import com.murilo_pereira.httpresolve.strategy.BulkheadStrategy;
import com.murilo_pereira.httpresolve.strategy.RateLimitStrategy;

/**
 * Context holding both bulkhead and rate limit for a policy
 */
public class LimiterContext {
	private final String name;
	private final BulkheadStrategy bulkhead;
	private final RateLimitStrategy rateLimit;

	public LimiterContext(String name, BulkheadStrategy bulkhead, RateLimitStrategy rateLimit) {
		this.name = name;
		this.bulkhead = bulkhead;
		this.rateLimit = rateLimit;
	}

	public String getName() {
		return name;
	}

	public BulkheadStrategy getBulkhead() {
		return bulkhead;
	}

	public RateLimitStrategy getRateLimit() {
		return rateLimit;
	}
}
