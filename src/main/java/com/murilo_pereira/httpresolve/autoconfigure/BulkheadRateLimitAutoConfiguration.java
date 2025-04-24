package com.murilo_pereira.httpresolve.autoconfigure;

import com.murilo_pereira.httpresolve.config.BulkheadRateLimitProperties;
import com.murilo_pereira.httpresolve.core.BulkheadRateLimitManager;
import com.murilo_pereira.httpresolve.core.BulkheadRateLimitRegistry;
import com.murilo_pereira.httpresolve.core.interceptor.BulkheadRateLimitAspect;
import com.murilo_pereira.httpresolve.metrics.BulkheadRateLimitMetrics;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Lazy;

/**
 * Auto-configuration for Bulkhead and Rate Limit
 */
@Configuration
@EnableAspectJAutoProxy
@EnableConfigurationProperties(BulkheadRateLimitProperties.class)
@ConditionalOnProperty(value = "bulkhead-rate-limit.enabled", havingValue = "true", matchIfMissing = true)
public class BulkheadRateLimitAutoConfiguration {

	@Bean
	@ConditionalOnMissingBean
	public BulkheadRateLimitRegistry bulkheadRateLimitRegistry(BulkheadRateLimitProperties properties) {
		return new BulkheadRateLimitRegistry(properties);
	}

	@Bean
	@ConditionalOnMissingBean
	@ConditionalOnClass(MeterRegistry.class)
	public BulkheadRateLimitMetrics bulkheadRateLimitMetrics(
			BulkheadRateLimitRegistry registry,
			@Lazy MeterRegistry meterRegistry) {
		return new BulkheadRateLimitMetrics(registry, meterRegistry);
	}

	@Bean
	@ConditionalOnMissingBean
	public BulkheadRateLimitManager bulkheadRateLimitManager(
			BulkheadRateLimitRegistry registry, BulkheadRateLimitMetrics metrics) {
		return new BulkheadRateLimitManager(registry, metrics);
	}

	@Bean
	@ConditionalOnMissingBean
	public BulkheadRateLimitAspect bulkheadRateLimitAspect(BulkheadRateLimitManager manager) {
		return new BulkheadRateLimitAspect(manager);
	}
}
