package com.example.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI sangueSolidarioOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Sangue Solidário API")
                        .description("API REST para gerenciamento de estoque de sangue — Projeto Blood Stock Service")
                        .version("1.0.0")
                        .license(new License().name("MIT License").url("https://opensource.org/licenses/MIT"))
                )
                .externalDocs(new ExternalDocumentation()
                        .description("Documentação do Projeto no GitHub")
                        .url("https://github.com/c3ny/blood-stock-service"));
    }
}
