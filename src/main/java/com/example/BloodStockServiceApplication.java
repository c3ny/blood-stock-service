package com.example.blood_stock_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;




@SpringBootApplication(scanBasePackages = {
		"com.example.blood_stock_service",
		"com.example.blood_stock_service.repository"
})
public class BloodStockServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(BloodStockServiceApplication.class, args);
	}
}
