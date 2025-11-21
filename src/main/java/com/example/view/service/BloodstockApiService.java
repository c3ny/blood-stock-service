package com.example.view.service;

import com.example.dto.BatchEntryRequestDTO;
import com.example.dto.BatchExitBulkRequestDTO;
import com.example.dto.BatchExitRequestDTO;
import com.example.dto.CompanyDTO;
import com.example.entity.Batch;
import com.example.entity.Bloodstock;
import com.example.entity.BloodstockMovement;
import com.example.view.AuthSession;
import com.example.view.dto.BatchResponseDTO;
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
     * Helper para incluir JWT automaticamente em todas requisições
     */
    private HttpRequest.Builder withAuth(URI uri) {

        if (AuthSession.getToken() == null)
            throw new RuntimeException("Token JWT não disponível. Usuário não está autenticado.");

        return HttpRequest.newBuilder()
                .uri(uri)
                .header("Accept", "application/json")
                .header("Authorization", "Bearer " + AuthSession.getToken());
    }



    // ===========================
    // REQUESTS
    // ===========================

    private HttpRequest.Builder authorizedRequest(String url) {
        return HttpRequest.newBuilder()


                .uri(URI.create(url))
                .header("Accept", "application/json")
                .header("Authorization", "Bearer " + AuthSession.getToken());
    }


    public CompletableFuture<List<CompanyDTO>> fetchCompanies() {
        HttpRequest request = withAuth(URI.create(COMPANY_URL))
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

    public CompletableFuture<List<Bloodstock>> fetchBloodstockByCompany(UUID companyId) {
        HttpRequest request = withAuth(URI.create(BASE_URL + "/company/" + companyId))
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

    public CompletableFuture<Bloodstock> updateQuantity(UUID bloodstockId, int quantity) {
        HttpRequest request = withAuth(URI.create(BASE_URL + "/" + bloodstockId + "?quantity=" + quantity))
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

    public String batchExitBulk(UUID companyId, BatchExitBulkRequestDTO dto) throws Exception {
        String jsonBody = objectMapper.writeValueAsString(dto);

        HttpRequest request = withAuth(URI.create(BASE_URL + "/company/" + companyId + "/batch-exit/bulk"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200)
            throw new RuntimeException("Erro ao registrar saída em lote: " + response.body());

        return response.body();
    }

    public CompletableFuture<List<BloodstockMovement>> fetchHistoryByCompany(UUID companyId) {
        HttpRequest request = withAuth(URI.create(BASE_URL + "/history/report/" + companyId))
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

    public CompletableFuture<Bloodstock> saveBloodstock(Bloodstock bloodstock, UUID companyId) {
        try {
            String jsonBody = objectMapper.writeValueAsString(bloodstock);

            HttpRequest request = withAuth(URI.create(BASE_URL + "/company/" + companyId))
                    .header("Content-Type", "application/json")
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

    public List<BatchResponseDTO> getAvailableBatches(UUID companyId) throws Exception {
        HttpRequest request = withAuth(URI.create(BASE_URL + "/company/" + companyId + "/batches"))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200)
            throw new RuntimeException("Falha ao buscar lotes. Status: " + response.statusCode());

        return parseBatchList(response.body());
    }

    public List<BatchResponseDTO> batchEntry(UUID companyId, BatchEntryRequestDTO requestDTO) throws Exception {
        String jsonBody = objectMapper.writeValueAsString(requestDTO);

        HttpRequest request = withAuth(URI.create(BASE_URL + "/company/" + companyId + "/batch-entry"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 201)
            throw new RuntimeException("Falha ao registrar entrada de lote. Status: " + response.statusCode());

        return parseBatchList(response.body());
    }

    public Batch batchExit(UUID companyId, BatchExitRequestDTO requestDTO) throws Exception {
        String jsonBody = objectMapper.writeValueAsString(requestDTO);

        HttpRequest request = withAuth(URI.create(BASE_URL + "/company/" + companyId + "/batch-exit"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200)
            throw new RuntimeException("Falha ao registrar saída de lote. Status: " + response.statusCode() + " - " + response.body());

        return parseBatch(response.body());
    }


    // ========================
    // PARSERS
    // ========================

    private List<CompanyDTO> parseCompanyList(String json) {
        try {
            return Arrays.asList(objectMapper.readValue(json, CompanyDTO[].class));
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private List<Bloodstock> parseBloodstockList(String json) {
        try {
            return Arrays.asList(objectMapper.readValue(json, Bloodstock[].class));
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private List<BloodstockMovement> parseHistoryList(String json) {
        try {
            return Arrays.asList(objectMapper.readValue(json, BloodstockMovement[].class));
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private List<BatchResponseDTO> parseBatchList(String json) {
        try {
            return Arrays.asList(objectMapper.readValue(json, BatchResponseDTO[].class));
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private Batch parseBatch(String json) {
        try {
            return objectMapper.readValue(json, Batch.class);
        } catch (Exception e) {
            return null;
        }
    }

    private Bloodstock parseBloodstock(String json) {
        try {
            return objectMapper.readValue(json, Bloodstock.class);
        } catch (Exception e) {
            return null;
        }
    }
}
