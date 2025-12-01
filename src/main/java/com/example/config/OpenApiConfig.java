package com.example.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.ExternalDocumentation;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI sangueSolidarioOpenAPI() {

        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Blood Stock Service API")
                        .version("1.0.0")
                        .description("""
                                Serviço REST responsável pelo processamento e controle 
                                de estoque de sangue utilizado na plataforma Sangue Solidário.

                                🔐 **Autenticação:**
                                - Primeiro realize login em `/api/auth/login`
                                - Copie o token retornado
                                - Clique no botão **Authorize** na parte superior
                                - Cole APENAS o token (o Swagger adiciona `Bearer` automaticamente)
                                """)
                        .contact(new Contact()
                                .name("Caio César")
                                .email("email@exemplo.com")
                                .url("https://github.com/c3ny"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT"))
                )
                .externalDocs(new ExternalDocumentation()
                        .description("Repositório oficial")
                        .url("https://github.com/c3ny/blood-stock-service"))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                        )
                );
    }
}
