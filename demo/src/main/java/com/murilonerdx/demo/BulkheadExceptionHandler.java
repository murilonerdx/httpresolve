package com.murilonerdx.demo;

import com.murilo_pereira.httpresolve.exception.BulkheadRateLimitException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class BulkheadExceptionHandler {
	@ExceptionHandler(BulkheadRateLimitException.class)
	public ResponseEntity<String> handleBulkhead(BulkheadRateLimitException ex) {
		if (ex.getMessage() != null && ex.getMessage().contains("Bulkhead")) {
			return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
					.body("Serviço ocupado, tente mais tarde.");
		}
		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
				.body("Muitas requisições, tente novamente depois.");
	}
}

