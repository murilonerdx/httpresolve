package com.murilo_pereira.httpresolve.config;

// BulkheadRateLimitProperties.java

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Configuration properties for Bulkhead and Rate Limit settings
 */
@ConfigurationProperties(prefix = "bulkhead-rate-limit")
public class BulkheadRateLimitProperties {

	/**
	 * Whether to enable bulkhead-rate-limit (default: true)
	 */
	private boolean enabled = true;

	/**
	 * Default policy to use when no specific policy is defined or found
	 */
	private String defaultPolicy = "default";

	/**
	 * Map of named policies
	 */
	private Map<String, PolicyConfig> policies = new HashMap<>();

	/**
	 * Global (shared) rate limit across all instances
	 */
	private boolean distributedLimiter = false;

	/**
	 * Whether to publish metrics to actuator
	 */
	private boolean metricsEnabled = true;

	/**
	 * Configuration for each policy
	 */
	public static class PolicyConfig {
		/**
		 * Controls if policy is active
		 */
		private boolean enabled = true;

		/**
		 * Bulkhead configuration
		 */
		private BulkheadConfig bulkhead = new BulkheadConfig();

		/**
		 * Rate limit configuration
		 */
		private RateLimitConfig rateLimit = new RateLimitConfig();

		// Getters and setters
		public boolean isEnabled() {
			return enabled;
		}

		public void setEnabled(boolean enabled) {
			this.enabled = enabled;
		}

		public BulkheadConfig getBulkhead() {
			return bulkhead;
		}

		public void setBulkhead(BulkheadConfig bulkhead) {
			this.bulkhead = bulkhead;
		}

		public RateLimitConfig getRateLimit() {
			return rateLimit;
		}

		public void setRateLimit(RateLimitConfig rateLimit) {
			this.rateLimit = rateLimit;
		}
	}

	/**
	 * Bulkhead configuration
	 */
	public static class BulkheadConfig {
		/**
		 * Maximum concurrent executions allowed
		 */
		private int maxConcurrentCalls = 10;

		/**
		 * Queue size when maxConcurrentCalls is reached
		 * If queuing is enabled (maxQueueSize > 0), requests will wait;
		 * otherwise they will be rejected
		 */
		private int maxQueueSize = 0;

		/**
		 * Timeout for queued requests
		 */
		private Duration queueTimeout = Duration.ofMillis(500);

		// Getters and setters
		public int getMaxConcurrentCalls() {
			return maxConcurrentCalls;
		}

		public void setMaxConcurrentCalls(int maxConcurrentCalls) {
			this.maxConcurrentCalls = maxConcurrentCalls;
		}

		public int getMaxQueueSize() {
			return maxQueueSize;
		}

		public void setMaxQueueSize(int maxQueueSize) {
			this.maxQueueSize = maxQueueSize;
		}

		public Duration getQueueTimeout() {
			return queueTimeout;
		}

		public void setQueueTimeout(Duration queueTimeout) {
			this.queueTimeout = queueTimeout;
		}
	}

	/**
	 * Rate limit configuration
	 */
	public static class RateLimitConfig {
		/**
		 * Limit strategy (FIXED_WINDOW, SLIDING_WINDOW, TOKEN_BUCKET)
		 */
		private String strategy = "FIXED_WINDOW";

		/**
		 * Number of requests allowed per time window
		 */
		private int limit = 100;

		/**
		 * Time window duration
		 */
		private Duration window = Duration.ofSeconds(1);

		// Getters and setters
		public String getStrategy() {
			return strategy;
		}

		public void setStrategy(String strategy) {
			this.strategy = strategy;
		}

		public int getLimit() {
			return limit;
		}

		public void setLimit(int limit) {
			this.limit = limit;
		}

		public Duration getWindow() {
			return window;
		}

		public void setWindow(Duration window) {
			this.window = window;
		}
	}

	// Getters and setters
	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getDefaultPolicy() {
		return defaultPolicy;
	}

	public void setDefaultPolicy(String defaultPolicy) {
		this.defaultPolicy = defaultPolicy;
	}

	public Map<String, PolicyConfig> getPolicies() {
		return policies;
	}

	public void setPolicies(Map<String, PolicyConfig> policies) {
		this.policies = policies;
	}

	public boolean isDistributedLimiter() {
		return distributedLimiter;
	}

	public void setDistributedLimiter(boolean distributedLimiter) {
		this.distributedLimiter = distributedLimiter;
	}

	public boolean isMetricsEnabled() {
		return metricsEnabled;
	}

	public void setMetricsEnabled(boolean metricsEnabled) {
		this.metricsEnabled = metricsEnabled;
	}
}

