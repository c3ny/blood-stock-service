package com.example.view.service;

import com.example.entity.Bloodstock;
import com.example.entity.BloodstockMovement;
import com.example.dto.response.CompanyDTO;
import com.example.dto.response.BatchResponseDTO;
import com.example.dto.request.BatchEntryRequestDTO;
import com.example.dto.request.BatchExitRequestDTO;
import com.example.dto.request.BatchExitBulkRequestDTO;
import com.example.dto.response.BloodstockDTO;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;



public class BloodstockApiService {

    private static final String BASE_URL = "http://localhost:8081/api";
    private final HttpClient client;
    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .configure(DeserializationFeature.READ_DATE_TIMESTAMPS_AS_NANOSECONDS, false)
            .configure(DeserializationFeature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE, false)
            .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);



    public BloodstockApiService() {
        this.client = HttpClient.newHttpClient();
    }

    // -------------------- LOGIN --------------------
    public CompletableFuture<Boolean> login(String email, String password) {
        String json = String.format("{\"username\": \"%s\", \"password\": \"%s\"}", email, password);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        return client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(response -> {
                    if (response.statusCode() == 200) {
                        String extractedToken = extractToken(response.body());
                        AuthSession.attemptDirectTokenInjection(extractedToken); // 🔥 novo passo
                        return true;
                    }
                    return false;
                });
    }


    private String extractToken(String json) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readTree(json).get("token").asText();
        } catch (Exception e) {
            return null;
        }
    }

    // -------------------- COMPANIES --------------------
    public CompletableFuture<List<CompanyDTO>> fetchCompanies() {
        HttpRequest request = authenticatedGET("/company");

        return client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(HttpResponse::body)
                .thenApply(json -> parseList(json, CompanyDTO.class));
    }

    // -------------------- STOCK --------------------
    public CompletableFuture<List<BloodstockDTO>> fetchBloodstockByCompany(UUID companyId) {
        HttpRequest request = authenticatedGET("/stock/company/" + companyId);

        return client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(HttpResponse::body)
                .thenApply(json -> parseList(json, BloodstockDTO.class));
    }


    public CompletableFuture<List<BloodstockMovement>> fetchHistoryByCompany(UUID companyId) {
        HttpRequest request = authenticatedGET("/bloodstock/" + companyId + "/movements");

        return client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(HttpResponse::body)
                .thenApply(json -> parseList(json, BloodstockMovement.class));
    }

    // -------------------- UPDATE STOCK --------------------
    public CompletableFuture<Bloodstock> updateQuantity(UUID stockId, int quantity) {

        String json = String.format("{\"quantity\": %d}", quantity);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/stock/" + stockId + "?quantity=" + quantity))
                .header("Authorization", "Bearer " + AuthSession.getToken())
                .method("PUT", HttpRequest.BodyPublishers.noBody())
                .build();


        return client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(HttpResponse::body)
                .thenApply(responseJson -> {
                    try {
                        return mapper.readValue(responseJson, Bloodstock.class);
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                });
    }



    public CompletableFuture<Bloodstock> saveBloodstock(BloodstockDTO bloodstock, UUID companyId) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            String json = mapper.writeValueAsString(bloodstock);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/stock/save/" + companyId))
                    .header("Authorization", "Bearer " + AuthSession.getToken())

                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            return client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .thenApply(HttpResponse::body)
                    .thenApply(responseJson -> {
                        try {
                            return mapper.readValue(responseJson, Bloodstock.class);
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    });

        } catch (Exception e) {
            e.printStackTrace();
            return CompletableFuture.failedFuture(e);
        }
    }


    // -------------------- BATCH ENTRY --------------------
    public CompletableFuture<Void> batchEntry(UUID companyId, BatchEntryRequestDTO request) {
        try {
            String json = mapper.writeValueAsString(request);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/stock/company/" + companyId + "/batch-entry"))
                    .header("Authorization", "Bearer " + AuthSession.getToken())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            return client.sendAsync(httpRequest, HttpResponse.BodyHandlers.ofString())
                    .thenApply(response -> {
                        if (response.statusCode() >= 200 && response.statusCode() < 300) {
                            return null;
                        } else {
                            throw new RuntimeException("Erro na requisição (" + response.statusCode() + "): " + response.body());
                        }
                    });

        } catch (Exception e) {
            return CompletableFuture.failedFuture(e);
        }
    }



    // -------------------- BATCH EXIT --------------------
    public void batchExit(UUID companyId, BatchExitRequestDTO dto) {
        sendObject("/stock/company/" + companyId + "/batch-exit", dto);
    }


    public CompletableFuture<Void> batchExitBulk(UUID companyId, BatchExitBulkRequestDTO dto) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            String json = mapper.writeValueAsString(dto);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/stock/company/" + companyId + "/batch-exit/bulk"))
                    .header("Authorization", "Bearer " + AuthSession.getToken())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            return client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .thenApply(res -> null); // Transform response em Void

        } catch (Exception e) {
            return CompletableFuture.failedFuture(e);
        }
    }


    // -------------------- AVAILABLE BATCHES --------------------
    public List<BatchResponseDTO> getAvailableBatches(UUID companyId) throws Exception {
        HttpRequest request = authenticatedGET("/stock/company/" + companyId + "/batches");


        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        return parseList(response.body(), BatchResponseDTO.class);
    }

    // -------------------- HELPERS --------------------

    private <T> void sendObject(String endpoint, T obj) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            String json = mapper.writeValueAsString(obj);
            authenticatedPOST(endpoint, json);

        } catch (Exception ignored) {}
    }

    private HttpRequest authenticatedGET(String endpoint) {
        return HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + endpoint))
                .header("Authorization", "Bearer " + AuthSession.getToken())

                .GET()
                .build();
    }

    private void authenticatedPOST(String endpoint, String body) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + endpoint))
                    .header("Authorization", "Bearer " + AuthSession.getToken())

                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            client.sendAsync(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception ignored) {}
    }

    private <T> List<T> parseList(String json, Class<T> clazz) {
        try {
            return mapper.readValue(
                    json,
                    mapper.getTypeFactory().constructCollectionType(List.class, clazz)
            );
        } catch (Exception e) {
            System.out.println("❌ Erro ao converter JSON -> " + clazz.getSimpleName() + ":");
            System.out.println(json);
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

}
