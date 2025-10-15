package com.example.view.service;

import com.example.model.Bloodstock;
import com.example.model.BloodstockMovement;
import com.example.model.CompanyDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Serviço para comunicação assíncrona com a API REST do backend.
 * Utiliza HttpClient moderno do Java 11+ com CompletableFuture.
 */
public class BloodstockApiService {

    private static final String BASE_URL = "http://localhost:8081/api/stock";
    private static final String COMPANY_URL = "http://localhost:8081/api/company";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public BloodstockApiService() {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    /**
     * Busca todas as empresas de forma assíncrona.
     */
    public CompletableFuture<List<CompanyDTO>> fetchCompanies() {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(COMPANY_URL))
                .header("Accept", "application/json")
                .GET()
                .build();

        return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(HttpResponse::body)
                .thenApply(this::parseCompanyList)
                .exceptionally(e -> {
                    System.err.println("Erro ao buscar empresas: " + e.getMessage());
                    return Collections.emptyList();
                });
    }

    /**
     * Busca o estoque de uma empresa específica de forma assíncrona.
     */
    public CompletableFuture<List<Bloodstock>> fetchBloodstockByCompany(UUID companyId) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/company/" + companyId))
                .header("Accept", "application/json")
                .GET()
                .build();

        return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(HttpResponse::body)
                .thenApply(this::parseBloodstockList)
                .exceptionally(e -> {
                    System.err.println("Erro ao buscar estoque: " + e.getMessage());
                    return Collections.emptyList();
                });
    }

    /**
     * Busca o histórico de movimentações de uma empresa de forma assíncrona.
     */
    public CompletableFuture<List<BloodstockMovement>> fetchHistoryByCompany(UUID companyId) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/history/report/" + companyId))
                .header("Accept", "application/json")
                .GET()
                .build();

        return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(HttpResponse::body)
                .thenApply(this::parseHistoryList)
                .exceptionally(e -> {
                    System.err.println("Erro ao buscar histórico: " + e.getMessage());
                    return Collections.emptyList();
                });
    }

    /**
     * Cria ou atualiza um item de estoque de forma assíncrona.
     */
    public CompletableFuture<Bloodstock> saveBloodstock(Bloodstock bloodstock, UUID companyId) {
        try {
            String jsonBody = objectMapper.writeValueAsString(bloodstock);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/company/" + companyId))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .thenApply(HttpResponse::body)
                    .thenApply(this::parseBloodstock)
                    .exceptionally(e -> {
                        System.err.println("Erro ao salvar estoque: " + e.getMessage());
                        return null;
                    });
        } catch (Exception e) {
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Atualiza a quantidade de um item de estoque de forma assíncrona.
     */
    public CompletableFuture<Bloodstock> updateQuantity(UUID bloodstockId, int quantity) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/" + bloodstockId + "?quantity=" + quantity))
                .header("Accept", "application/json")
                .PUT(HttpRequest.BodyPublishers.noBody())
                .build();

        return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(HttpResponse::body)
                .thenApply(this::parseBloodstock)
                .exceptionally(e -> {
                    System.err.println("Erro ao atualizar quantidade: " + e.getMessage());
                    return null;
                });
    }

    // ==================== Métodos auxiliares de parsing ====================

    private List<CompanyDTO> parseCompanyList(String json) {
        try {
            CompanyDTO[] companies = objectMapper.readValue(json, CompanyDTO[].class);
            return Arrays.asList(companies);
        } catch (Exception e) {
            System.err.println("Erro ao parsear lista de empresas: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<Bloodstock> parseBloodstockList(String json) {
        try {
            Bloodstock[] bloodstocks = objectMapper.readValue(json, Bloodstock[].class);
            return Arrays.asList(bloodstocks);
        } catch (Exception e) {
            System.err.println("Erro ao parsear lista de estoque: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<BloodstockMovement> parseHistoryList(String json) {
        try {
            BloodstockMovement[] movements = objectMapper.readValue(json, BloodstockMovement[].class);
            return Arrays.asList(movements);
        } catch (Exception e) {
            System.err.println("Erro ao parsear histórico: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    private Bloodstock parseBloodstock(String json) {
        try {
            return objectMapper.readValue(json, Bloodstock.class);
        } catch (Exception e) {
            System.err.println("Erro ao parsear bloodstock: " + e.getMessage());
            return null;
        }
    }
}