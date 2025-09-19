package com.example.view;

import com.example.model.Company;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.HashMap;
import javafx.util.StringConverter;

public class BloodstockForm extends Application {

    private static final String BASE_URL = "http://localhost:8080/api/stock/";
    private static final String COMPANY_URL = "http://localhost:8080/api/company";

    private ComboBox<Company> companyComboBox;
    private Label statusLabel;

    @Override
    public void start(Stage stage) {

        // Campo para tipo sanguíneo
        TextField bloodTypeField = new TextField();
        bloodTypeField.setPromptText("Tipo sanguíneo (ex: O+)");

        // Campo para quantidade
        TextField quantityField = new TextField();
        quantityField.setPromptText("Quantidade");

        // ComboBox para selecionar company
        companyComboBox = new ComboBox<>();
        companyComboBox.setPromptText("Selecione a company");

        companyComboBox.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(Company item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? null : item.getInstitution_name());
            }
        });

        companyComboBox.setConverter(new StringConverter<>() {
            @Override
            public String toString(Company company) {
                return company == null ? null : company.getInstitution_name();
            }

            @Override
            public Company fromString(String string) {
                // Não usado, mas precisa implementar
                return null;
            }
        });

        // Botão de envio
        Button submitButton = new Button("Enviar");
        submitButton.setStyle("-fx-background-color: #d32f2f; -fx-text-fill: white; -fx-font-weight: bold;");

        statusLabel = new Label();

        submitButton.setOnAction(e -> sendBloodstock(bloodTypeField, quantityField));

        // Layout
        VBox root = new VBox(15, companyComboBox, bloodTypeField, quantityField, submitButton, statusLabel);
        root.setPadding(new Insets(20));
        root.setStyle("-fx-background-color: white;");

        Scene scene = new Scene(root, 350, 250);
        stage.setTitle("Cadastro de Estoque de Sangue");
        stage.setScene(scene);
        stage.show();

        // Carregar companies do backend
        loadCompanies();
    }

    private void loadCompanies() {
        new Thread(() -> {
            try {
                URL url = new URL(COMPANY_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("Accept", "application/json");

                int responseCode = conn.getResponseCode();
                if (responseCode != 200) {
                    throw new RuntimeException("HTTP error: " + responseCode);
                }

                ObjectMapper mapper = new ObjectMapper();
                Company[] companies = mapper.readValue(conn.getInputStream(), Company[].class);

                Platform.runLater(() -> {
                    companyComboBox.getItems().clear();
                    companyComboBox.getItems().addAll(companies);
                    if (!companies.equals(null)) {
                        statusLabel.setText("Companies carregadas!");
                        statusLabel.setStyle("-fx-text-fill: green;");
                    }
                });

            } catch (Exception e) {
                Platform.runLater(() -> {
                    statusLabel.setText("Erro: backend não disponível");
                    statusLabel.setStyle("-fx-text-fill: red;");
                    companyComboBox.getItems().clear();
                });
                System.err.println("Erro ao carregar companies: " + e.getMessage());
            }
        }).start();
    }


    private void sendBloodstock(TextField bloodTypeField, TextField quantityField) {
        Company selectedCompany = companyComboBox.getSelectionModel().getSelectedItem();
        if (selectedCompany == null) {
            statusLabel.setText("Selecione uma company antes de enviar!");
            statusLabel.setStyle("-fx-text-fill: red;");
            return;
        }

        new Thread(() -> {
            try {
                String bloodType = bloodTypeField.getText();
                int quantity = Integer.parseInt(quantityField.getText());
                UUID companyId = selectedCompany.getId();

                Map<String, Object> data = new HashMap<>();
                data.put("blood_type", bloodType);
                data.put("quantity", quantity);

                ObjectMapper mapper = new ObjectMapper();
                String json = mapper.writeValueAsString(data);

                URL url = new URL(BASE_URL + companyId);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; utf-8");
                conn.setDoOutput(true);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(json.getBytes());
                }

                int responseCode = conn.getResponseCode();
                Platform.runLater(() -> {
                    if (responseCode == 200 || responseCode == 201) {
                        statusLabel.setText("Dados enviados com sucesso!");
                        statusLabel.setStyle("-fx-text-fill: green;");
                    } else {
                        statusLabel.setText("Erro ao enviar: " + responseCode);
                        statusLabel.setStyle("-fx-text-fill: red;");
                    }
                });

            } catch (Exception ex) {
                ex.printStackTrace();
                Platform.runLater(() -> {
                    statusLabel.setText("Erro: " + ex.getMessage());
                    statusLabel.setStyle("-fx-text-fill: red;");
                });
            }
        }).start();
    }

    public static void main(String[] args) {
        launch();
    }
}
