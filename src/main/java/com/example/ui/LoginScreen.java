package com.example.ui;

import com.example.service.AuthService;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public class LoginScreen {

    public void start(Stage stage, Runnable onLoginSuccess, AuthService authService) {
        TextField usernameField = new TextField();
        usernameField.setPromptText("Usuário");

        PasswordField passwordField = new PasswordField();
        passwordField.setPromptText("Senha");

        Label status = new Label();

        Button loginButton = new Button("Entrar");

        loginButton.setOnAction(e -> {
            try {
                String token = authService.login(usernameField.getText(), passwordField.getText());
                status.setText("Login realizado com sucesso!");
                onLoginSuccess.run();
            } catch (Exception ex) {
                status.setText("Falha no login!");
            }
        });

        VBox layout = new VBox(10, usernameField, passwordField, loginButton, status);
        layout.setAlignment(Pos.CENTER);

        stage.setScene(new Scene(layout, 300, 200));
        stage.show();
    }
}
