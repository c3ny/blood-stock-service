package com.example;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
@OpenAPIDefinition(
        info = @Info(
                title = "Sangue Solidário API",
                version = "1.0.0",
                description = "Serviço REST para gerenciamento de estoques e movimentações de sangue."
        )
)
@SpringBootApplication(scanBasePackages = "com.example")
@EnableJpaRepositories("com.example.respository")
@EntityScan({"com.example.entity", "com.example.model"})
public class BloodStockServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BloodStockServiceApplication.class, args);
    }
}
