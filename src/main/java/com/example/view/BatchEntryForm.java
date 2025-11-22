package com.example.view;

import com.example.dto.request.BatchEntryRequestDTO;
import com.example.view.service.BloodstockApiService;
import javafx.animation.FadeTransition;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.VBox;
import javafx.scene.layout.HBox;
import javafx.geometry.Pos;
import javafx.util.Duration;
import java.net.URL;
import javafx.stage.Modality;
import javafx.stage.Stage;
import java.util.function.Consumer;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class BatchEntryForm extends Stage {

    private final BloodstockApiService apiService;
    private final UUID companyId;
    private final Consumer<UUID> onUpdateCallback;
    private final String[] bloodTypes = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"};
    private final Map<String, TextField> quantityFields = new HashMap<>();
    private final TextField batchCodeField = new TextField();
    private Label statusLabel;

    public interface StockUpdateCallback extends Consumer<UUID> {}

    public BatchEntryForm(Stage owner, BloodstockApiService apiService, UUID companyId, Consumer<UUID> onUpdateCallback) {
        this.onUpdateCallback = onUpdateCallback;
        this.apiService = apiService;
        this.companyId = companyId;

        setTitle("Entrada de Estoque por Lote");
        getIcons().add(new javafx.scene.image.Image(getClass().getResourceAsStream("/icon.png")));
        initModality(Modality.WINDOW_MODAL);
        initOwner(owner);
        setResizable(false);

        VBox root = new VBox(20);
        root.getStyleClass().add("modal-container");
        root.setPadding(new Insets(30));
        root.setAlignment(Pos.TOP_CENTER);

        // Header do modal
        VBox header = createHeader();

        // Grid com campos
        GridPane grid = createFormGrid();

        // Botões de ação
        HBox buttonBox = createButtonBox();

        // Label de status
        statusLabel = new Label();
        statusLabel.getStyleClass().add("status-label");
        statusLabel.setVisible(false);
        statusLabel.setMaxWidth(Double.MAX_VALUE);

        root.getChildren().addAll(header, grid, buttonBox, statusLabel);

        Scene scene = new Scene(root, 550, 850);
        URL cssUrl = getClass().getResource("/style.css");
        if (cssUrl != null) scene.getStylesheets().add(cssUrl.toExternalForm());
        setScene(scene);

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

        Label titleLabel = new Label("📦 Registro de Entrada por Lote");
        titleLabel.getStyleClass().add("modal-title");

        Label subtitleLabel = new Label("Adicione múltiplos tipos sanguíneos de uma só vez");
        subtitleLabel.getStyleClass().add("modal-subtitle");

        header.getChildren().addAll(titleLabel, subtitleLabel);
        return header;
    }

    private GridPane createFormGrid() {
        GridPane grid = new GridPane();
        grid.getStyleClass().add("modal-form-grid");
        grid.setHgap(18);
        grid.setVgap(14);
        grid.setAlignment(Pos.CENTER);

        // Campo Código do Lote com destaque
        VBox batchBox = new VBox(6);
        batchBox.getStyleClass().add("batch-code-container");

        Label batchCodeLabel = new Label("🏷 Código do Lote");
        batchCodeLabel.getStyleClass().add("field-label-primary");

        batchCodeField.getStyleClass().add("modern-field-large");
        batchCodeField.setPromptText("Ex: LOTE-20251120");

        batchBox.getChildren().addAll(batchCodeLabel, batchCodeField);
        grid.add(batchBox, 0, 0, 2, 1);

        // Separador visual
        Separator separator = new Separator();
        separator.getStyleClass().add("form-separator");
        grid.add(separator, 0, 1, 2, 1);

        // Label de instrução
        Label instructionLabel = new Label("Digite as quantidades para cada tipo sanguíneo:");
        instructionLabel.getStyleClass().add("instruction-label");
        grid.add(instructionLabel, 0, 2, 2, 1);

        // Campos de Quantidade por Tipo Sanguíneo (2 colunas)
        int row = 3;
        int col = 0;

        for (String type : bloodTypes) {
            VBox fieldBox = createBloodTypeField(type);
            grid.add(fieldBox, col, row);

            col++;
            if (col > 1) {
                col = 0;
                row++;
            }
        }

        return grid;
    }

    private VBox createBloodTypeField(String type) {
        VBox box = new VBox(6);
        box.getStyleClass().add("blood-type-field-box");

        HBox labelBox = new HBox(6);
        labelBox.setAlignment(Pos.CENTER_LEFT);

        Label typeLabel = new Label(type);
        typeLabel.getStyleClass().addAll("field-label", "blood-type-badge");

        labelBox.getChildren().add(typeLabel);

        TextField field = new TextField();
        field.getStyleClass().add("modern-field");
        field.setPromptText("0");
        field.setPrefWidth(200);

        // Validação de apenas números
        field.setTextFormatter(new TextFormatter<String>(change -> {
            String newText = change.getControlNewText();
            if (newText.matches("\\d*")) {
                return change;
            }
            return null;
        }));

        quantityFields.put(type, field);

        box.getChildren().addAll(labelBox, field);
        return box;
    }

    private HBox createButtonBox() {
        HBox buttonBox = new HBox(12);
        buttonBox.setAlignment(Pos.CENTER);
        buttonBox.setPadding(new Insets(10, 0, 0, 0));

        Button clearButton = new Button("🗑 Limpar Tudo");
        clearButton.getStyleClass().addAll("secondary-button", "clear-button");
        clearButton.setOnAction(e -> clearAllFields());

        Button saveButton = new Button("✅ Salvar Entrada");
        saveButton.getStyleClass().addAll("primary-button", "save-button");
        saveButton.setOnAction(e -> saveBatchEntry());

        buttonBox.getChildren().addAll(clearButton, saveButton);
        return buttonBox;
    }



    private void clearAllFields() {
        batchCodeField.clear();
        quantityFields.values().forEach(TextField::clear);
        hideStatus();
    }

    private void saveBatchEntry() {
        String batchCode = batchCodeField.getText().trim();
        if (batchCode.isEmpty()) {
            showStatus("❌ O código do lote não pode ser vazio.", "error");
            return;
        }

        Map<String, Integer> quantities = new HashMap<>();
        boolean hasValidEntry = false;

        for (String type : bloodTypes) {
            String text = quantityFields.get(type).getText().trim();
            int quantity = text.isEmpty() ? 0 : Integer.parseInt(text);
            quantities.put(type, quantity);
            if (quantity > 0) hasValidEntry = true;
        }

        if (!hasValidEntry) {
            showStatus("⚠️ Pelo menos um tipo sanguíneo deve ter quantidade maior que zero.", "error");
            return;
        }

        BatchEntryRequestDTO requestDTO = new BatchEntryRequestDTO();
        requestDTO.setBatchCode(batchCode);
        requestDTO.setBloodQuantities(quantities);

        apiService.batchEntry(companyId, requestDTO)
                .thenRunAsync(() -> Platform.runLater(() -> {
                    showStatus("Entrada registrada com sucesso!", "success");
                    onUpdateCallback.accept(companyId);
                    quantityFields.values().forEach(TextField::clear);
                    batchCodeField.clear();
                }))
                .exceptionally(e -> {
                    Platform.runLater(() -> showStatus("Erro ao registrar entrada.", "error"));
                    e.printStackTrace();
                    return null;
                });


    }
    private String extractErrorMessage(Throwable e) {
        if (e.getMessage() != null) {
            return e.getMessage();
        }

        if (e.getCause() != null && e.getCause().getMessage() != null) {
            return e.getCause().getMessage();
        }

        return "Erro desconhecido";
    }




    private void showStatus(String message, String type) {
        statusLabel.setText(message);
        statusLabel.getStyleClass().clear();
        statusLabel.getStyleClass().addAll("status-label", type + "-status");
        statusLabel.setVisible(true);

        // Animação de entrada
        FadeTransition fade = new FadeTransition(Duration.millis(200), statusLabel);
        fade.setFromValue(0);
        fade.setToValue(1);
        fade.play();
    }

    private void hideStatus() {
        statusLabel.setVisible(false);
    }

    private void showAlert(Alert.AlertType type, String title, String message) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}