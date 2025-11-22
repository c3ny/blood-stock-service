package com.example.service;

import com.example.dto.request.LoginRequest;
import com.example.dto.response.LoginResponseDTO;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class AuthService {

    private static final String API_URL = "http://localhost:8081/auth/login";
    private String token;

    public String login(String username, String password) throws Exception {
        URL url = new URL(API_URL);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();

        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);

        ObjectMapper mapper = new ObjectMapper();
        LoginRequest request = new LoginRequest(username, password);

        try (OutputStream os = connection.getOutputStream()) {
            os.write(mapper.writeValueAsBytes(request));
        }

        if (connection.getResponseCode() == 200) {
            LoginResponseDTO response = mapper.readValue(connection.getInputStream(), LoginResponseDTO.class);
            this.token = response.getToken();
            return token;
        } else {
            throw new RuntimeException("Falha no login: " + connection.getResponseCode());
        }
    }

    public String getToken() {
        return token;
    }
}
