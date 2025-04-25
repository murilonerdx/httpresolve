package com.murilonerdx.demo;

import com.murilo_pereira.httpresolve.annotation.EnableBulkheadRateLimit;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@EnableBulkheadRateLimit
@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

}
