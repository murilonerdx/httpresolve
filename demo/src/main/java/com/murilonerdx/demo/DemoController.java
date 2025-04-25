package com.murilonerdx.demo;

import com.murilo_pereira.httpresolve.annotation.BulkheadRateLimit;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("demo")
public class DemoController {

	@BulkheadRateLimit("default")
	@GetMapping("/pagamento-protegido")
	public String protegido() throws InterruptedException {
		return "PROTEGIDO (Bulkhead + RateLimit no default)";
	}

	@GetMapping("/pagamento-livre")
	public String livre() throws InterruptedException {
//		Thread.sleep(2000L);
		return "SEM PROTEÇÃO";
	}
}

