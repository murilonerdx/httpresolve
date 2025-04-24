package com.murilo_pereira.httpresolve.core.interceptor;

import com.murilo_pereira.httpresolve.annotation.BulkheadRateLimit;
import com.murilo_pereira.httpresolve.core.BulkheadRateLimitManager;
import com.murilo_pereira.httpresolve.exception.BulkheadRateLimitException;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * AOP Aspect to intercept methods annotated with @BulkheadRateLimit
 */
@Aspect
@Component
@Order(1) // High precedence to ensure it runs before other aspects
public class BulkheadRateLimitAspect {
	private static final Logger log = LoggerFactory.getLogger(BulkheadRateLimitAspect.class);

	private final BulkheadRateLimitManager manager;

	@Autowired
	public BulkheadRateLimitAspect(BulkheadRateLimitManager manager) {
		this.manager = manager;
	}

	@Around("@annotation(com.murilo_pereira.httpresolve.annotation.BulkheadRateLimit)")
	public Object applyBulkheadRateLimit(ProceedingJoinPoint joinPoint) throws Throwable {
		// Get the method being called
		MethodSignature signature = (MethodSignature) joinPoint.getSignature();
		Method method = signature.getMethod();

		// Get the annotation
		BulkheadRateLimit annotation = method.getAnnotation(BulkheadRateLimit.class);
		String policyName = annotation.value();
		boolean fallbackToDefault = annotation.fallbackToDefault();

		// Create context for logging
		String methodIdentifier = method.getDeclaringClass().getSimpleName() + "." + method.getName();

		try {
			log.debug("Applying bulkhead/rate-limit [{}] to method: {}", policyName, methodIdentifier);

			// Execute with bulkhead and rate limit
			return manager.execute(policyName, fallbackToDefault, () -> {
				try {
					return joinPoint.proceed();
				} catch (Throwable e) {
					throw new RuntimeException(e);
				}
			});
		} catch (BulkheadRateLimitException e) {
			log.warn("Bulkhead/Rate-limit [{}] rejected execution of method: {}", policyName, methodIdentifier);
			throw e;
		}
	}
}
