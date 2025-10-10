package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.example")
@EnableJpaRepositories("com.example.respository")
@EntityScan({"com.example.entity", "com.example.model"})
public class BloodStockServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BloodStockServiceApplication.class, args);
    }
}
