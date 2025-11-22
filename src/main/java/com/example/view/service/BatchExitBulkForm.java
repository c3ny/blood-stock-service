package com.example.view.service;

import com.example.dto.request.BatchExitBulkRequestDTO;
import com.example.view.dto.BatchResponseDTO;

import javafx.animation.FadeTransition;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.util.Duration;
import javafx.util.StringConverter;

import java.net.URL;
import java.util.*;

public class BatchExitBulkForm extends Stage {

    private final BloodstockApiService api;
    private final UUID companyId;
    private final Runnable refreshCallback;

    private ComboBox<BatchResponseDTO> comboBatch;
    private final Map<String, TextField> qtyInputs = new HashMap<>();
    private final Map<String, Label> availableLabels = new HashMap<>();
    private Label statusLabel;
    private Label totalQuantityLabel;

    private final List<String> BLOOD_TYPES = Arrays.asList(
            "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
    );

    public BatchExitBulkForm(Stage owner, BloodstockApiService api, UUID companyId, Runnable refreshCallback) {
        this.api = api;
        this.companyId = companyId;
        this.refreshCallback = refreshCallback;

        setTitle("Saída por Lote (Bulk)");
        getIcons().add(new javafx.scene.image.Image(getClass().getResourceAsStream("/icon.png")));
        initOwner(owner);
        initModality(Modality.WINDOW_MODAL);
        setResizable(false);

        VBox root = new VBox(20);
        root.getStyleClass().add("modal-container");
        root.setPadding(new Insets(30));
        root.setAlignment(Pos.TOP_CENTER);

        // Header
        VBox header = createHeader();

        // Seleção de Lote
        VBox batchSection = createBatchSection();

        // Separador
        Separator separator = new Separator();
        separator.getStyleClass().add("form-separator");

        // Grid de Tipos Sanguíneos
        VBox gridSection = createBloodTypeGrid();

        // Label de Total
        totalQuantityLabel = new Label();
        totalQuantityLabel.getStyleClass().add("total-quantity-label");
        totalQuantityLabel.setVisible(false);

        // Botões
        HBox buttonBox = createButtonBox();

        // Status
        statusLabel = new Label();
        statusLabel.getStyleClass().add("status-label");
        statusLabel.setVisible(false);
        statusLabel.setMaxWidth(Double.MAX_VALUE);

        root.getChildren().addAll(header, batchSection, separator, gridSection, totalQuantityLabel, buttonBox, statusLabel);

        Scene scene = new Scene(root, 600, 1050);
        URL css = getClass().getResource("/style.css");
        if (css != null) scene.getStylesheets().add(css.toExternalForm());

        setScene(scene);
        loadBatches();

        // Animação de entrada
        FadeTransition fade = new FadeTransition(Duration.millis(250), root);
        fade.setFromValue(0);
        fade.setToValue(1);
        fade.play();
    }

    private VBox createHeader() {
        VBox header = new VBox(8);
        header.setAlignment(Pos.CENTER);
        header.getStyleClass().add("modal-header");

        Label titleLabel = new Label("📦 Saída em Lote (Bulk)");
        titleLabel.getStyleClass().add("modal-title");

        Label subtitleLabel = new Label("Retire múltiplos tipos sanguíneos de um único lote");
        subtitleLabel.getStyleClass().add("modal-subtitle");

        header.getChildren().addAll(titleLabel, subtitleLabel);
        return header;
    }

    private VBox createBatchSection() {
        VBox section = new VBox(10);
        section.getStyleClass().add("bulk-batch-section");

        Label batchTitle = new Label("🎯 Selecione o Lote");
        batchTitle.getStyleClass().add("subsection-title");

        comboBatch = new ComboBox<>();
        comboBatch.getStyleClass().add("modern-combo-large");
        comboBatch.setPromptText("Escolha um lote disponível");
        comboBatch.setMaxWidth(Double.MAX_VALUE);

        comboBatch.setConverter(new StringConverter<>() {
            @Override
            public String toString(BatchResponseDTO batch) {
                if (batch == null) return "";

                String types = batch.bloodDetails() == null || batch.bloodDetails().isEmpty()
                        ? "Sem tipos"
                        : batch.bloodDetails().stream()
                        .map(d -> d.bloodType())
                        .distinct()
                        .collect(java.util.stream.Collectors.joining(", "));

                return String.format("Lote %s - [%s] (%d un.)",
                        batch.batchCode(),
                        types,
                        batch.totalQuantity());
            }

            @Override
            public BatchResponseDTO fromString(String s) {
                return null;
            }
        });

        comboBatch.setOnAction(e -> loadBatchDetails());

        section.getChildren().addAll(batchTitle, comboBatch);
        return section;
    }

    private VBox createBloodTypeGrid() {
        VBox container = new VBox(12);
        container.getStyleClass().add("bulk-grid-container");

        Label gridTitle = new Label("🩸 Quantidades por Tipo Sanguíneo");
        gridTitle.getStyleClass().add("subsection-title");

        GridPane grid = new GridPane();
        grid.getStyleClass().add("bulk-blood-grid");
        grid.setHgap(16);
        grid.setVgap(12);
        grid.setAlignment(Pos.CENTER);

        int row = 0;
        for (String type : BLOOD_TYPES) {
            HBox typeBox = createBloodTypeRow(type);
            grid.add(typeBox, 0, row);
            row++;
        }

        container.getChildren().addAll(gridTitle, grid);
        return container;
    }

    private HBox createBloodTypeRow(String type) {
        HBox row = new HBox(12);
        row.getStyleClass().add("bulk-blood-row");
        row.setAlignment(Pos.CENTER_LEFT);
        row.setPrefWidth(500);

        // Badge do tipo sanguíneo
        Label lblType = new Label(type);
        lblType.getStyleClass().add("blood-type-badge-bulk");
        lblType.setMinWidth(60);
        lblType.setAlignment(Pos.CENTER);

        // Label "Disponível: X"
        Label lblAvailable = new Label("Disponível: -");
        lblAvailable.getStyleClass().add("available-label-bulk");
        lblAvailable.setMinWidth(120);
        availableLabels.put(type, lblAvailable);

        // Campo de entrada
        TextField txt = new TextField();
        txt.getStyleClass().add("modern-field-bulk");
        txt.setPromptText("Qtd");
        txt.setPrefWidth(100);
        txt.setDisable(true);

        // Validação de apenas números
        txt.setTextFormatter(new TextFormatter<String>(change -> {
            String newText = change.getControlNewText();
            if (newText.matches("\\d*")) {
                return change;
            }
            return null;
        }));

        // Atualizar total ao digitar
        txt.textProperty().addListener((obs, oldVal, newVal) -> updateTotalQuantity());

        qtyInputs.put(type, txt);

        row.getChildren().addAll(lblType, lblAvailable, txt);
        return row;
    }

    private HBox createButtonBox() {
        HBox buttonBox = new HBox(12);
        buttonBox.setAlignment(Pos.CENTER);
        buttonBox.setPadding(new Insets(10, 0, 0, 0));

        Button clearButton = new Button("🗑 Limpar Campos");
        clearButton.getStyleClass().addAll("secondary-button", "clear-button");
        clearButton.setOnAction(e -> clearFields());

        Button confirmBtn = new Button("✅ Confirmar Saída");
        confirmBtn.getStyleClass().addAll("primary-button", "exit-button");
        confirmBtn.setOnAction(e -> submit());

        buttonBox.getChildren().addAll(clearButton, confirmBtn);
        return buttonBox;
    }

    private void loadBatches() {
        try {
            List<BatchResponseDTO> list = api.getAvailableBatches(companyId);
            comboBatch.getItems().setAll(list);

            if (list.isEmpty()) {
                showStatus("⚠️ Nenhum lote disponível no momento.", "warning");
            }
        } catch (Exception e) {
            showStatus("❌ Erro ao carregar lotes: " + e.getMessage(), "error");
        }
    }

    private void loadBatchDetails() {
        BatchResponseDTO batch = comboBatch.getValue();
        if (batch == null) return;

        // Reset todos os campos
        BLOOD_TYPES.forEach(type -> {
            availableLabels.get(type).setText("Disponível: -");
            qtyInputs.get(type).clear();
            qtyInputs.get(type).setDisable(true);
        });

        // Preencher com dados do lote
        batch.bloodDetails().forEach(detail -> {
            String type = detail.bloodType();
            int qty = detail.quantity();

            availableLabels.get(type).setText("Disponível: " + qty);
            qtyInputs.get(type).setDisable(qty == 0);

            // Adicionar classe CSS baseada na disponibilidade
            if (qty == 0) {
                availableLabels.get(type).getStyleClass().add("unavailable");
            } else {
                availableLabels.get(type).getStyleClass().remove("unavailable");
            }
        });

        showStatus("✅ Lote carregado! Preencha as quantidades desejadas.", "success");
        totalQuantityLabel.setVisible(false);
    }

    private void clearFields() {
        BLOOD_TYPES.forEach(type -> qtyInputs.get(type).clear());
        updateTotalQuantity();
        hideStatus();
    }

    private void updateTotalQuantity() {
        int total = BLOOD_TYPES.stream()
                .mapToInt(type -> {
                    String text = qtyInputs.get(type).getText();
                    return text.isEmpty() ? 0 : Integer.parseInt(text);
                })
                .sum();

        if (total > 0) {
            totalQuantityLabel.setText(String.format("📊 Total a retirar: %d unidades", total));
            totalQuantityLabel.setVisible(true);
        } else {
            totalQuantityLabel.setVisible(false);
        }
    }

    private void submit() {
        BatchResponseDTO batch = comboBatch.getValue();
        if (batch == null) {
            showStatus("⚠️ Selecione um lote antes de continuar.", "error");
            return;
        }

        Map<String, Integer> quantities = new HashMap<>();

        for (String type : BLOOD_TYPES) {
            TextField field = qtyInputs.get(type);
            if (!field.isDisabled() && !field.getText().isEmpty()) {
                int value = Integer.parseInt(field.getText());
                String availableText = availableLabels.get(type).getText().replace("Disponível: ", "");
                int available = Integer.parseInt(availableText);

                if (value <= 0) {
                    showStatus("⚠️ A quantidade deve ser maior que zero para " + type, "error");
                    return;
                }

                if (value > available) {
                    showStatus(String.format("❌ Quantidade solicitada (%d) é maior que o disponível (%d) para %s",
                            value, available, type), "error");
                    return;
                }

                quantities.put(type, value);
            }
        }

        if (quantities.isEmpty()) {
            showStatus("⚠️ Informe pelo menos uma quantidade para retirada.", "error");
            return;
        }

        try {
            BatchExitBulkRequestDTO dto = new BatchExitBulkRequestDTO();
            dto.setBatchId(batch.id());
            dto.setQuantities(quantities);

            api.batchExitBulk(companyId, dto)
                    .thenCompose(v -> api.fetchBloodstockByCompany(companyId)) // espera backend atualizar
                    .thenAccept(updated -> Platform.runLater(() -> {
                        showStatus("✅ Saída registrada com sucesso!", "success");

                        refreshCallback.run(); // agora roda depois do retorno real da API

                        new Thread(() -> {
                            try { Thread.sleep(1200); } catch (InterruptedException ignored) {}
                            Platform.runLater(this::close);
                        }).start();
                    }))
                    .exceptionally(e -> {
                        Platform.runLater(() -> showStatus("❌ Erro: " + e.getMessage(), "error"));
                        return null;
                    });


            // Aguardar um pouco antes de fechar
            new Thread(() -> {
                try {
                    Thread.sleep(1500);
                    javafx.application.Platform.runLater(this::close);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }).start();

        } catch (Exception e) {
            showStatus("❌ Erro ao processar saída: " + e.getMessage(), "error");
        }
    }

    private void showStatus(String message, String type) {
        statusLabel.setText(message);
        statusLabel.getStyleClass().clear();
        statusLabel.getStyleClass().addAll("status-label", type + "-status");
        statusLabel.setVisible(true);

        FadeTransition fade = new FadeTransition(Duration.millis(200), statusLabel);
        fade.setFromValue(0);
        fade.setToValue(1);
        fade.play();
    }

    private void hideStatus() {
        statusLabel.setVisible(false);
    }

    private void alert(String msg) {
        new Alert(Alert.AlertType.INFORMATION, msg, ButtonType.OK).showAndWait();
    }
}