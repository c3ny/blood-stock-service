package com.example.view.service;

import com.example.view.config.AppConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import javafx.application.Platform;
import javafx.scene.control.Alert;
import javafx.stage.Stage;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class AuthSession {

    private static String token;
    private static final HttpClient client = HttpClient.newHttpClient();

    public static String getToken() { return token; }

    public static void logout() { token = null; }
    public static void attemptDirectTokenInjection(String receivedToken) {
        token = receivedToken;
    }

    public static void attemptLogin(String username, String password, Stage loginStage) {
        try {
            token = null;

            String body = """
                    {"username":"%s","password":"%s"}
                    """.formatted(username, password);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(AppConfig.AUTH_LOGIN))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode json = mapper.readTree(response.body());
                token = json.get("token").asText();

                Platform.runLater(() -> {
                    loginStage.close();
                    new com.example.view.BloodstockFormRefactored().start(new Stage());
                });
            } else {
                new Alert(Alert.AlertType.ERROR, "Login inválido!").show();
            }

        } catch (Exception e) {
            e.printStackTrace();
            new Alert(Alert.AlertType.ERROR, "Erro ao conectar ao servidor").show();
        }
    }
}
