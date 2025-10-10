package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {
		"com.example.blood_stock_service",
		"com.example.blood_stock_service.repository",
        "com.example",
})
public class BloodStockServiceApplication {
	public static void main(String[] args) {
        SpringApplication.run(BloodStockServiceApplication.class, args);
	}


}

