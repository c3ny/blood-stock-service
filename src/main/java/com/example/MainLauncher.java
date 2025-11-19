package com.example;

import com.example.view.BloodstockForm;
import com.example.view.SplashScreen;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.stage.Stage;
import org.springframework.boot.SpringApplication;

import java.net.Socket;

public class MainLauncher extends Application {

    private SplashScreen splash;

    @Override
    public void start(Stage primaryStage) {
        System.out.println("============================================");
        System.out.println("    INICIANDO SISTEMA SANGUE SOLIDÁRIO");
        System.out.println("============================================");
        System.out.println("\nAguarde enquanto o servidor é carregado...");

        splash = new SplashScreen();

        splash.showSplash(() -> {

            // 1️⃣ Inicia o backend (Spring Boot) em outra thread
            new Thread(() -> SpringApplication.run(BloodStockServiceApplication.class)).start();

            // 2️⃣ Espera o servidor responder
            new Thread(() -> {
                waitForServer("localhost", 8081, 12000);

                // 3️⃣ Quando o backend estiver pronto, abre o frontend
                Platform.runLater(() -> {
                    try {
                        splash.closeSplash();
                        System.out.println(" Abrindo interface principal...");

                        // Cria e configura a janela principal
                        Stage mainStage = new Stage();
                        BloodstockForm form = new BloodstockForm();
                        form.start(mainStage);

                        // 🔹 Ajuste visual: centraliza e define tamanho fixo
                        mainStage.setWidth(1200);
                        mainStage.setHeight(700);
                        mainStage.centerOnScreen();
                        mainStage.setIconified(false);
                        mainStage.show();

                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                });
            }).start();
        });
    }

    // ✅ Método main precisa ser static
    public static void main(String[] args) {
        // Força o uso do banco H2
        System.setProperty("spring.profiles.active", "h2");

        // Inicia o JavaFX (que por sua vez chama o start acima)
        launch(args);
    }

    private void waitForServer(String host, int port, int timeoutMs) {
        long start = System.currentTimeMillis();
        boolean conectado = false;

        System.out.println("⏳ Aguardando servidor iniciar na porta " + port + "...");

        while (System.currentTimeMillis() - start < timeoutMs) {
            try (Socket socket = new Socket(host, port)) {
                System.out.println("✅ Servidor pronto após " + (System.currentTimeMillis() - start) + "ms");
                conectado = true;
                break;
            } catch (Exception e) {
                try {
                    Thread.sleep(500);
                } catch (InterruptedException ignored) {}
            }
        }

        if (!conectado) {
            System.err.println("⚠️ Servidor não respondeu na porta " + port + " após " + timeoutMs + "ms.");
        }
    }
}
