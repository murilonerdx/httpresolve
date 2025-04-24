package com.murilo_pereira.httpresolve.annotation;

import com.murilo_pereira.httpresolve.autoconfigure.BulkheadRateLimitAutoConfiguration;
import org.springframework.context.annotation.Import;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Enables the Bulkhead and Rate Limit functionality
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(BulkheadRateLimitAutoConfiguration.class)
public @interface EnableBulkheadRateLimit {
}
