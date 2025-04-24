package com.murilo_pereira.httpresolve.core;

import com.murilo_pereira.httpresolve.config.BulkheadRateLimitProperties;
import com.murilo_pereira.httpresolve.strategy.BulkheadStrategy;
import com.murilo_pereira.httpresolve.strategy.FixedWindowRateLimitStrategy;
import com.murilo_pereira.httpresolve.strategy.RateLimitStrategy;
import com.murilo_pereira.httpresolve.strategy.SemaphoreBulkheadStrategy;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registry for all configured limiters
 */
@Component
public class BulkheadRateLimitRegistry {
	private static final Logger log = LoggerFactory.getLogger(BulkheadRateLimitRegistry.class);

	private final Map<String, LimiterContext> limiters = new ConcurrentHashMap<>();
	private final BulkheadRateLimitProperties properties;

	@Autowired
	public BulkheadRateLimitRegistry(BulkheadRateLimitProperties properties) {
		this.properties = properties;
	}

	@PostConstruct
	public void initialize() {
		// Create all configured limiters
		if (properties.isEnabled()) {
			for (Map.Entry<String, BulkheadRateLimitProperties.PolicyConfig> entry : properties.getPolicies().entrySet()) {
				String name = entry.getKey();
				BulkheadRateLimitProperties.PolicyConfig config = entry.getValue();

				if (config.isEnabled()) {
					createLimiter(name, config);
					log.info("Created bulkhead/rate-limit for policy: {}", name);
				}
			}

			// Always ensure default exists
			if (!limiters.containsKey(properties.getDefaultPolicy())) {
				BulkheadRateLimitProperties.PolicyConfig defaultConfig = properties.getPolicies().getOrDefault(
						properties.getDefaultPolicy(), new BulkheadRateLimitProperties.PolicyConfig());
				createLimiter(properties.getDefaultPolicy(), defaultConfig);
				log.info("Created default bulkhead/rate-limit policy");
			}
		}
	}

	private void createLimiter(String name, BulkheadRateLimitProperties.PolicyConfig config) {
		BulkheadStrategy bulkhead = new SemaphoreBulkheadStrategy(config.getBulkhead());

		RateLimitStrategy rateLimit;
		String strategy = config.getRateLimit().getStrategy();
		if ("FIXED_WINDOW".equalsIgnoreCase(strategy)) {
			rateLimit = new FixedWindowRateLimitStrategy(config.getRateLimit());
		} else {
			log.warn("Unsupported rate limit strategy: {}. Using FIXED_WINDOW", strategy);
			rateLimit = new FixedWindowRateLimitStrategy(config.getRateLimit());
		}

		limiters.put(name, new LimiterContext(name, bulkhead, rateLimit));
	}

	public Set<String> getPolicyNames() {
		return new HashSet<>(limiters.keySet());
	}

	/**
	 * Gets a named limiter context
	 * @param name the policy name
	 * @return the limiter context
	 * @throws IllegalArgumentException if no limiter with given name exists
	 */
	public LimiterContext getLimiter(String name) {
		LimiterContext limiter = limiters.get(name);
		if (limiter == null) {
			throw new IllegalArgumentException("No bulkhead/rate-limit policy found with name: " + name);
		}
		return limiter;
	}

	/**
	 * Gets a limiter by name or returns the default limiter if not found
	 * @param name policy name to look for
	 * @return the named limiter or default limiter
	 */
	public LimiterContext getLimiterOrDefault(String name) {
		LimiterContext limiter = limiters.get(name);
		if (limiter == null) {
			return limiters.get(properties.getDefaultPolicy());
		}
		return limiter;
	}
}
