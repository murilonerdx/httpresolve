package com.murilo_pereira.httpresolve.metrics;


import com.murilo_pereira.httpresolve.core.BulkheadRateLimitRegistry;
import com.murilo_pereira.httpresolve.core.LimiterContext;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Metrics for bulkhead and rate limit
 */
@Component
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@ConditionalOnClass(MeterRegistry.class)
@ConditionalOnProperty(value = "bulkhead-rate-limit.metrics-enabled", havingValue = "true", matchIfMissing = true)
public class BulkheadRateLimitMetrics {

	private final BulkheadRateLimitRegistry registry;
	private MeterRegistry meterRegistry; // Removido final para permitir injeção tardia

	private final Map<String, Counter> bulkheadRejectedCounters = new ConcurrentHashMap<>();
	private final Map<String, Counter> rateLimitRejectedCounters = new ConcurrentHashMap<>();
	private final Map<String, Counter> executionErrorCounters = new ConcurrentHashMap<>();
	private final Map<String, Counter> bulkheadSuccessCounters = new ConcurrentHashMap<>();
	private final Map<String, Counter> rateLimitSuccessCounters = new ConcurrentHashMap<>();

	public BulkheadRateLimitMetrics(BulkheadRateLimitRegistry registry, MeterRegistry meterRegistry) {
		this.registry = registry;
		this.meterRegistry = meterRegistry;
	}

	// Setter injection em vez de constructor injection para o MeterRegistry
	@Autowired(required = false)
	public void setMeterRegistry(MeterRegistry meterRegistry) {
		this.meterRegistry = meterRegistry;
		// Se já temos nomes de política disponíveis, podemos inicializar as métricas aqui
		if (this.meterRegistry != null) {
			initializeMetrics();
		}
	}

	@PostConstruct
	public void initialize() {
		// Se o MeterRegistry já estiver disponível, inicializar as métricas
		if (meterRegistry != null) {
			initializeMetrics();
		}
	}

	private void initializeMetrics() {
		try {
			// Create counters for each policy
			for (String name : registry.getPolicyNames()) {
				registerMetricsForPolicy(name);
			}
		} catch (Exception e) {
			// Log a erro mas não deixe falhar a inicialização do contexto
			// Pode cair aqui se getPolicyNames() ainda não for seguro de chamar
			// ou se houver outras falhas no ciclo de vida
			System.err.println("Failed to initialize metrics: " + e.getMessage());
		}
	}

	private void registerMetricsForPolicy(String name) {
		try {
			LimiterContext limiter = registry.getLimiter(name);

			// Bulkhead gauges
			Gauge.builder("bulkhead.available", limiter,
							l -> l.getBulkhead().getMetrics().getAvailable())
					.tag("policy", name)
					.description("Available permits in the bulkhead")
					.register(meterRegistry);

			Gauge.builder("bulkhead.queue.size", limiter,
							l -> l.getBulkhead().getMetrics().getQueueSize())
					.tag("policy", name)
					.description("Current queue size in the bulkhead")
					.register(meterRegistry);

			// Rate limit gauges
			Gauge.builder("ratelimit.available", limiter,
							l -> l.getRateLimit().getMetrics().getAvailable())
					.tag("policy", name)
					.description("Available permits in the rate limiter")
					.register(meterRegistry);

			Gauge.builder("ratelimit.remaining.window", limiter,
							l -> l.getRateLimit().getMetrics().getRemainingWindowMillis())
					.tag("policy", name)
					.description("Remaining time in current rate limit window in milliseconds")
					.register(meterRegistry);

			// Rejected counters
			bulkheadRejectedCounters.put(name, Counter.builder("bulkhead.rejected")
					.tag("policy", name)
					.description("Number of requests rejected by the bulkhead")
					.register(meterRegistry));

			rateLimitRejectedCounters.put(name, Counter.builder("ratelimit.rejected")
					.tag("policy", name)
					.description("Number of requests rejected by the rate limiter")
					.register(meterRegistry));

			executionErrorCounters.put(name, Counter.builder("execution.error")
					.tag("policy", name)
					.description("Number of execution errors")
					.register(meterRegistry));

			bulkheadSuccessCounters.put(name, Counter.builder("bulkhead.success")
					.tag("policy", name)
					.description("Number of successful bulkhead acquisitions")
					.register(meterRegistry));

			rateLimitSuccessCounters.put(name, Counter.builder("ratelimit.success")
					.tag("policy", name)
					.description("Number of successful rate limit acquisitions")
					.register(meterRegistry));
		} catch (Exception e) {
			// Log e continue, não deixe uma política inválida quebrar tudo
			System.err.println("Failed to register metrics for policy " + name + ": " + e.getMessage());
		}
	}

	/**
	 * Record methods made safe to handle null MeterRegistry
	 */
	public void recordBulkheadRejected(String policyName) {
		if (meterRegistry != null && bulkheadRejectedCounters.containsKey(policyName)) {
			bulkheadRejectedCounters.get(policyName).increment();
		} else if (meterRegistry != null && bulkheadRejectedCounters.containsKey("default")) {
			bulkheadRejectedCounters.get("default").increment();
		}
	}

	public void recordRateLimitRejected(String policyName) {
		if (meterRegistry != null && rateLimitRejectedCounters.containsKey(policyName)) {
			rateLimitRejectedCounters.get(policyName).increment();
		} else if (meterRegistry != null && rateLimitRejectedCounters.containsKey("default")) {
			rateLimitRejectedCounters.get("default").increment();
		}
	}

	public void recordExecutionError(String policyName) {
		if (meterRegistry != null && executionErrorCounters.containsKey(policyName)) {
			executionErrorCounters.get(policyName).increment();
		} else if (meterRegistry != null && executionErrorCounters.containsKey("default")) {
			executionErrorCounters.get("default").increment();
		}
	}

	public void recordBulkheadSuccess(String policyName) {
		if (meterRegistry != null && bulkheadSuccessCounters.containsKey(policyName)) {
			bulkheadSuccessCounters.get(policyName).increment();
		} else if (meterRegistry != null && bulkheadSuccessCounters.containsKey("default")) {
			bulkheadSuccessCounters.get("default").increment();
		}
	}

	public void recordRateLimitSuccess(String policyName) {
		if (meterRegistry != null && rateLimitSuccessCounters.containsKey(policyName)) {
			rateLimitSuccessCounters.get(policyName).increment();
		} else if (meterRegistry != null && rateLimitSuccessCounters.containsKey("default")) {
			rateLimitSuccessCounters.get("default").increment();
		}
	}

	/**
	 * Common tags for metrics
	 */
	@Bean
	@ConditionalOnClass(name = "org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer")
	public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
		return registry -> registry.config().commonTags("component", "bulkhead-rate-limit");
	}
}
