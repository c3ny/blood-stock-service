package com.example.view;

import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.scene.text.Font;
import javafx.stage.Stage;
import com.example.view.service.AuthSession;


public class LoginForm extends Application {

    @Override
    public void start(Stage stage) {

        Label title = new Label("🩸 Sangue Solidário");
        title.setFont(Font.font(20));

        TextField usernameField = new TextField();
        usernameField.setPromptText("Usuário");

        PasswordField passwordField = new PasswordField();
        passwordField.setPromptText("Senha");

        Label statusLabel = new Label();
        statusLabel.setStyle("-fx-text-fill: red;");

        Button loginButton = new Button("Entrar");
        loginButton.setPrefWidth(200);

        ProgressIndicator loading = new ProgressIndicator();
        loading.setVisible(false);
        loading.setPrefSize(40, 40);

        loginButton.setOnAction(e -> {

            String user = usernameField.getText().trim();
            String pass = passwordField.getText().trim();

            statusLabel.setText("");

            if (user.isEmpty() || pass.isEmpty()) {
                statusLabel.setText("⚠ Preencha todos os campos!");
                return;
            }

            loginButton.setDisable(true);
            loading.setVisible(true);

            new Thread(() -> {
                try {
                    AuthSession.attemptLogin(user, pass, stage);
                } catch (Exception ex) {
                    ex.printStackTrace();
                    statusLabel.setText("❌ Erro ao conectar ao servidor");
                } finally {
                    // voltar ao JavaFX Thread
                    javafx.application.Platform.runLater(() -> {
                        loginButton.setDisable(false);
                        loading.setVisible(false);
                    });
                }
            }).start();
        });

        VBox layout = new VBox(12, title, usernameField, passwordField, loginButton, loading, statusLabel);
        layout.setPadding(new Insets(20));
        layout.setAlignment(Pos.CENTER);

        Scene scene = new Scene(layout, 350, 300);

        stage.setScene(scene);
        stage.setTitle("Login - Sangue Solidário");
        stage.setResizable(false);
        stage.show();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
