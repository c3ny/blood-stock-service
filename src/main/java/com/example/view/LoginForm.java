package com.example.view;

import javafx.application.Application;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public class LoginForm extends Application {

    @Override
    public void start(Stage stage) {

        Label label = new Label("Login - Sangue Solidário");

        TextField usernameField = new TextField();
        usernameField.setPromptText("Usuário");

        PasswordField passwordField = new PasswordField();
        passwordField.setPromptText("Senha");

        Button loginButton = new Button("Entrar");

        loginButton.setOnAction(e -> {
            com.example.view.AuthSession.attemptLogin(usernameField.getText(), passwordField.getText(), stage);
        });

        VBox layout = new VBox(10, label, usernameField, passwordField, loginButton);
        layout.setAlignment(Pos.CENTER);
        Scene scene = new Scene(layout, 350, 250);

        stage.setScene(scene);
        stage.setTitle("Autenticação");
        stage.show();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
