package com.murilo_pereira.httpresolve.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a method to be protected by bulkhead and rate limiting.
 * The specified policy name must match a configured policy in application properties.
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface BulkheadRateLimit {
	/**
	 * Name of the policy to apply
	 */
	String value();

	/**
	 * Whether to fallback to a default policy if specified one not found
	 */
	boolean fallbackToDefault() default false;
}
