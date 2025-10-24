package com.example.view;

import javafx.animation.FadeTransition;
import javafx.application.Platform;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.stage.Stage;
import javafx.stage.StageStyle;
import javafx.util.Duration;

import java.net.URL;

public class SplashScreen {

    private Stage stage;

    /**
     * Mostra a tela de splash e executa a ação fornecida após o fade-in.
     *
     * @param onFinished Ação que será executada após a animação inicial (ex: iniciar backend).
     */
    public void showSplash(Runnable onFinished) {
        Platform.runLater(() -> {
            stage = new Stage(StageStyle.UNDECORATED);
            stage.setAlwaysOnTop(true);
            stage.centerOnScreen();

            // ⚙️ Logo
            URL logoUrl = getClass().getResource("/logo.png");
            ImageView logoView;
            if (logoUrl != null) {
                logoView = new ImageView(new Image(logoUrl.toExternalForm()));
                logoView.setFitWidth(150);
                logoView.setPreserveRatio(true);
            } else {
                System.err.println("⚠️ Arquivo 'logo.png' não encontrado nos resources!");
                logoView = new ImageView();
            }

            // ⚙️ Texto
            Label label = new Label("Iniciando Sistema Sangue Solidário...");
            label.setTextFill(Color.DARKRED);
            label.setStyle("-fx-font-size: 16px; -fx-font-weight: bold;");

            // ⚙️ Layout
            VBox root = new VBox(15, logoView, label);
            root.setAlignment(Pos.CENTER);
            root.setStyle("-fx-background-color: white; -fx-padding: 30;");

            Scene scene = new Scene(root, 400, 300);
            stage.setScene(scene);

            // Animação de entrada
            FadeTransition fadeIn = new FadeTransition(Duration.seconds(1.5), root);
            fadeIn.setFromValue(0);
            fadeIn.setToValue(1);
            fadeIn.play();

            stage.show();

            // Executa a ação (por exemplo: iniciar backend)
            new Thread(() -> {
                try {
                    Thread.sleep(1500); // tempo para o fade-in antes de iniciar backend
                } catch (InterruptedException ignored) {}
                onFinished.run();
            }).start();
        });
    }

    /**
     * Fecha a tela de splash com animação suave.
     */
    public void closeSplash() {
        if (stage == null) return;

        Platform.runLater(() -> {
            FadeTransition fadeOut = new FadeTransition(Duration.seconds(1.2), stage.getScene().getRoot());
            fadeOut.setFromValue(1);
            fadeOut.setToValue(0);
            fadeOut.setOnFinished(e -> stage.close());
            fadeOut.play();
        });
    }
}
