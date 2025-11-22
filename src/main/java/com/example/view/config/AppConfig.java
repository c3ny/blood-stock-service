package com.example.view.config;

import java.util.UUID;

public class AppConfig {

    public static final String BASE_URL = "http://localhost:8081/api";

    // === ROTAS AUTH ===
    public static final String AUTH_LOGIN = BASE_URL + "/auth/login";
    public static final String AUTH_REGISTER = BASE_URL + "/auth/register";

    // === BASES ===
    public static final String STOCK = BASE_URL + "/stock";
    public static final String COMPANY = BASE_URL + "/company";

    // === ROTAS CORRETAS PARA O BACKEND ===
    public static String companyStock(UUID id) { return STOCK + "/company/" + id; }
    public static String companyHistory(UUID id) { return STOCK + "/company/" + id + "/history"; }
    public static String companyBatches(UUID id) { return STOCK + "/company/" + id + "/batches"; }
    public static String batchEntry(UUID id) { return STOCK + "/company/" + id + "/batch-entry"; }
    public static String batchExit(UUID id) { return STOCK + "/company/" + id + "/batch-exit"; }
    public static String batchExitBulk(UUID id) { return STOCK + "/company/" + id + "/batch-exit/bulk"; }
}
