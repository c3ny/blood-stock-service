package com.example.view;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import javafx.application.Platform;
import javafx.stage.Stage;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class AuthSession {

    private static String token;
    private static final HttpClient client = HttpClient.newHttpClient();

    public static String getToken() {
        return token;
    }

    public static void attemptLogin(String username, String password, Stage loginStage) {

        try {
            String json = """
                    {
                        "username": "%s",
                        "password": "%s"
                    }
                    """.formatted(username, password);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8081/api/auth/login"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode jsonNode = mapper.readTree(response.body());
                token = jsonNode.get("token").asText();

                Platform.runLater(() -> {
                    loginStage.close();
                    new BloodstockFormRefactored().start(new Stage());
                });

            } else {
                System.out.println("Login inválido: " + response.body());
            }

        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }
}
