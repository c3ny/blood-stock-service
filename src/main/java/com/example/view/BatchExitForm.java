package com.example.view;

import com.example.dto.request.BatchExitBulkRequestDTO;
import com.example.dto.response.BatchResponseDTO;
import com.example.dto.response.BloodDetailDTO;
import com.example.view.service.BloodstockApiService;
import javafx.animation.FadeTransition;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.geometry.Pos;
import javafx.util.Duration;
import java.net.URL;
import javafx.scene.layout.VBox;
import javafx.stage.Modality;
import javafx.stage.Stage;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;
import javafx.util.StringConverter;

import java.util.List;
import java.util.UUID;

public class BatchExitForm extends Stage {

    private final BloodstockApiService apiService;
    private final UUID companyId;
    private final Consumer<UUID> onUpdateCallback;
    private final ObservableList<BatchResponseDTO> availableBatches = FXCollections.observableArrayList();

    public interface StockUpdateCallback extends Consumer<UUID> {}

    private ComboBox<BatchResponseDTO> batchComboBox;
    private TextField quantityField;
    private TableView<BatchResponseDTO> batchTableView;
    private Label statusLabel;
    private Label availableQuantityLabel;

    public BatchExitForm(Stage owner, BloodstockApiService apiService, UUID companyId, Consumer<UUID> onUpdateCallback) {
        this.onUpdateCallback = onUpdateCallback;
        this.apiService = apiService;
        this.companyId = companyId;

        setTitle("Saída de Estoque por Lote");
        getIcons().add(new javafx.scene.image.Image(getClass().getResourceAsStream("/icon.png")));
        initModality(Modality.WINDOW_MODAL);
        initOwner(owner);
        setResizable(false);

        VBox root = new VBox(20);
        root.getStyleClass().add("modal-container");
        root.setPadding(new Insets(30));
        root.setAlignment(Pos.TOP_CENTER);

        // Header
        VBox header = createHeader();

        // Tabela de Lotes
        VBox tableSection = createTableSection();

        // Separador
        Separator separator = new Separator();
        separator.getStyleClass().add("form-separator");

        // Formulário
        VBox formSection = createFormSection();

        // Status
        statusLabel = new Label();
        statusLabel.getStyleClass().add("status-label");
        statusLabel.setVisible(false);
        statusLabel.setMaxWidth(Double.MAX_VALUE);

        root.getChildren().addAll(header, tableSection, separator, formSection, statusLabel);

        Scene scene = new Scene(root, 700, 680);
        URL cssUrl = getClass().getResource("/style.css");
        if (cssUrl != null) scene.getStylesheets().add(cssUrl.toExternalForm());
        setScene(scene);

        loadAvailableBatches();

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

        Label titleLabel = new Label("📤 Registro de Saída por Lote");
        titleLabel.getStyleClass().add("modal-title");

        Label subtitleLabel = new Label("Retire bolsas de sangue de lotes específicos");
        subtitleLabel.getStyleClass().add("modal-subtitle");

        header.getChildren().addAll(titleLabel, subtitleLabel);
        return header;
    }

    private VBox createTableSection() {
        VBox section = new VBox(10);
        section.getStyleClass().add("batch-table-section");

        HBox titleBox = new HBox(10);
        titleBox.setAlignment(Pos.CENTER_LEFT);

        Label tableTitle = new Label("📋 Lotes Disponíveis");
        tableTitle.getStyleClass().add("subsection-title");

        Label batchCount = new Label();
        batchCount.getStyleClass().add("batch-count-badge");

        // Atualizar contador quando a lista mudar
        availableBatches.addListener((javafx.collections.ListChangeListener.Change<? extends BatchResponseDTO> c) -> {
            batchCount.setText(availableBatches.size() + " lotes");
        });

        titleBox.getChildren().addAll(tableTitle, batchCount);

        batchTableView = createBatchTableView();

        section.getChildren().addAll(titleBox, batchTableView);
        return section;
    }

    private TableView<BatchResponseDTO> createBatchTableView() {
        TableView<BatchResponseDTO> tableView = new TableView<>(availableBatches);
        tableView.getStyleClass().add("batch-table");
        tableView.setPrefHeight(220);
        tableView.setPlaceholder(new Label("Nenhum lote disponível"));

        // Coluna: Código do Lote
        TableColumn<BatchResponseDTO, String> codeCol = new TableColumn<>("Código do Lote");
        codeCol.setCellValueFactory(new PropertyValueFactory<>("batchCode"));
        codeCol.setPrefWidth(150);
        codeCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                    setText(null);
                } else {
                    Label chip = new Label(item);
                    chip.getStyleClass().add("batch-code-chip");
                    setGraphic(chip);
                    setText(null);
                }
            }
        });

        // Coluna: Tipos Sanguíneos (múltiplos)
        TableColumn<BatchResponseDTO, List<BloodDetailDTO>> typeCol = new TableColumn<>("Tipos");
        typeCol.setCellValueFactory(new PropertyValueFactory<>("bloodDetails"));
        typeCol.setPrefWidth(120);
        typeCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(List<BloodDetailDTO> details, boolean empty) {
                super.updateItem(details, empty);
                if (empty || details == null || details.isEmpty()) {
                    setGraphic(null);
                    setText(null);
                } else {
                    // Criar badges para cada tipo sanguíneo
                    HBox badges = new HBox(4);
                    badges.setAlignment(javafx.geometry.Pos.CENTER_LEFT);

                    details.stream()
                            .map(detail -> {
                                Label badge = new Label(detail.bloodType());
                                badge.getStyleClass().add("blood-type-badge-table");
                                return badge;
                            })
                            .forEach(badges.getChildren()::add);

                    setGraphic(badges);
                    setText(null);
                }
            }
        });

        // Coluna: Quantidade Total
        TableColumn<BatchResponseDTO, Integer> quantityCol = new TableColumn<>("Quantidade");
        quantityCol.setCellValueFactory(cellData ->
                new javafx.beans.property.SimpleIntegerProperty(cellData.getValue().totalQuantity()).asObject()
        );
        quantityCol.setPrefWidth(100);
        quantityCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(Integer item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                    setText(null);
                } else {
                    Label chip = new Label(item + " un.");
                    chip.getStyleClass().add("qty-chip");
                    setGraphic(chip);
                    setText(null);
                }
            }
        });

        // Coluna: Data de Entrada
        TableColumn<BatchResponseDTO, java.time.LocalDate> dateCol = new TableColumn<>("Data de Entrada");
        dateCol.setCellValueFactory(new PropertyValueFactory<>("entryDate"));
        dateCol.setPrefWidth(120);
        dateCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(java.time.LocalDate item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    setText(item.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                }
            }
        });

        tableView.getColumns().addAll(codeCol, typeCol, quantityCol, dateCol);
        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);

        // Sincronizar seleção da tabela com o ComboBox
        tableView.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) {
                batchComboBox.getSelectionModel().select(newVal);
                updateAvailableQuantity(newVal.totalQuantity());
            }
        });

        return tableView;
    }

    private VBox createFormSection() {
        VBox section = new VBox(16);
        section.getStyleClass().add("exit-form-section");

        Label formTitle = new Label("🎯 Dados da Saída");
        formTitle.getStyleClass().add("subsection-title");

        GridPane formGrid = new GridPane();
        formGrid.setHgap(18);
        formGrid.setVgap(14);
        formGrid.setAlignment(Pos.CENTER);

        // ComboBox de Lote
        VBox batchBox = new VBox(6);
        Label batchLabel = new Label("Selecionar Lote:");
        batchLabel.getStyleClass().add("field-label");

        batchComboBox = createBatchComboBox();
        batchComboBox.getStyleClass().add("modern-combo");
        batchComboBox.setPrefWidth(300);

        batchBox.getChildren().addAll(batchLabel, batchComboBox);

        // Campo Quantidade
        VBox quantityBox = new VBox(6);
        Label qtyLabel = new Label("Quantidade de Saída:");
        qtyLabel.getStyleClass().add("field-label");

        quantityField = new TextField();
        quantityField.getStyleClass().add("modern-field");
        quantityField.setPromptText("Digite a quantidade");
        quantityField.setPrefWidth(200);
        quantityField.setTextFormatter(new TextFormatter<String>(change -> {
            String newText = change.getControlNewText();
            if (newText.matches("\\d*")) {
                return change;
            }
            return null;
        }));

        // Label de quantidade disponível
        availableQuantityLabel = new Label();
        availableQuantityLabel.getStyleClass().add("available-quantity-label");
        availableQuantityLabel.setVisible(false);

        quantityBox.getChildren().addAll(qtyLabel, quantityField, availableQuantityLabel);

        formGrid.add(batchBox, 0, 0);
        formGrid.add(quantityBox, 1, 0);

        // Botões
        HBox buttonBox = createButtonBox();

        section.getChildren().addAll(formTitle, formGrid, buttonBox);
        return section;
    }

    private ComboBox<BatchResponseDTO> createBatchComboBox() {
        ComboBox<BatchResponseDTO> comboBox = new ComboBox<>(availableBatches);
        comboBox.setPromptText("Selecione um lote");

        comboBox.setConverter(new StringConverter<>() {
            @Override
            public String toString(BatchResponseDTO batch) {
                if (batch == null) return "";

                // Pegar os tipos sanguíneos do lote
                String bloodTypes = batch.bloodDetails() == null || batch.bloodDetails().isEmpty()
                        ? "Sem tipos"
                        : batch.bloodDetails().stream()
                        .map(detail -> detail.bloodType())
                        .distinct()
                        .collect(java.util.stream.Collectors.joining(", "));

                return String.format("%s - [%s] (%d un.)",
                        batch.batchCode(),
                        bloodTypes,
                        batch.totalQuantity());
            }

            @Override
            public BatchResponseDTO fromString(String string) {
                return null;
            }
        });

        comboBox.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) {
                updateAvailableQuantity(newVal.totalQuantity());
                batchTableView.getSelectionModel().select(newVal);
            } else {
                availableQuantityLabel.setVisible(false);
            }
        });

        return comboBox;
    }

    private HBox createButtonBox() {
        HBox buttonBox = new HBox(12);
        buttonBox.setAlignment(Pos.CENTER);
        buttonBox.setPadding(new Insets(10, 0, 0, 0));

        Button refreshButton = new Button("🔄 Atualizar Lista");
        refreshButton.getStyleClass().addAll("secondary-button", "refresh-button");
        refreshButton.setOnAction(e -> {
            loadAvailableBatches();
            showStatus("✅ Lista atualizada!", "success");
        });

        Button exitButton = new Button("✅ Registrar Saída");
        exitButton.getStyleClass().addAll("primary-button", "exit-button");
        exitButton.setOnAction(e -> processBatchExit());

        buttonBox.getChildren().addAll(refreshButton, exitButton);
        return buttonBox;
    }

    private void updateAvailableQuantity(int quantity) {
        availableQuantityLabel.setText(String.format("💡 Disponível: %d unidades", quantity));
        availableQuantityLabel.setVisible(true);
    }

    private void loadAvailableBatches() {
        try {
            List<BatchResponseDTO> batches = apiService.getAvailableBatches(companyId);
            availableBatches.setAll(batches);

            if (batches.isEmpty()) {
                showStatus("⚠️ Nenhum lote disponível no momento.", "warning");
            }
        } catch (Exception e) {
            showStatus("❌ Erro ao carregar lotes: " + e.getMessage(), "error");
        }
    }
    private String extractErrorMessage(Throwable e) {

        if (e == null) return "Erro desconhecido";

        // Se a exceção tiver causa e mensagem
        if (e.getCause() != null && e.getCause().getMessage() != null) {
            return e.getCause().getMessage();
        }

        // Mensagem direta da exceção
        if (e.getMessage() != null && !e.getMessage().isBlank()) {
            return e.getMessage();
        }

        // Algumas exceções são HTTP errors encapsuladas, então tentamos ler response body
        if (e instanceof java.util.concurrent.CompletionException ce && ce.getCause() != null) {
            return extractErrorMessage(ce.getCause());
        }

        return "Erro desconhecido";
    }


    private void processBatchExit() {
        BatchResponseDTO selectedBatch = batchComboBox.getValue();
        String quantityText = quantityField.getText().trim();

        if (selectedBatch == null) {
            showStatus("⚠️ Selecione um lote antes de continuar.", "error");
            return;
        }

        if (quantityText.isEmpty()) {
            showStatus("⚠️ Informe a quantidade a ser retirada.", "error");
            return;
        }

        int quantity = Integer.parseInt(quantityText);

        if (quantity <= 0) {
            showStatus("⚠️ A quantidade deve ser maior que zero.", "error");
            return;
        }

        if (quantity > selectedBatch.totalQuantity()) {
            showStatus(String.format(
                    "❌ Quantidade solicitada (%d) é maior que o disponível (%d).",
                    quantity, selectedBatch.totalQuantity()
            ), "error");
            return;
        }

        showStatus("⏳ Processando saída...", "warning");

        // Criar o DTO corretamente no formato esperado pelo backend
        BatchExitBulkRequestDTO bulkRequest = new BatchExitBulkRequestDTO();
        bulkRequest.setBatchId(selectedBatch.id());

        // Construir o mapa de quantidades baseado nos tipos sanguíneos do lote
        Map<String, Integer> quantities = new HashMap<>();
        selectedBatch.bloodDetails().forEach(detail -> quantities.put(detail.bloodType(), quantity));

        bulkRequest.setQuantities(quantities);

        // Chamar a API e atualizar a interface após sucesso
        apiService.batchExitBulk(companyId, bulkRequest)
                .thenRun(() -> Platform.runLater(() -> {
                    showStatus("✅ Saída registrada com sucesso!", "success");

                    // 🔥 Atualiza imediatamente o estoque antes de atualizar a UI do lote
                    onUpdateCallback.accept(companyId);

                    loadAvailableBatches();

                    quantityField.clear();
                    batchComboBox.getSelectionModel().clearSelection();
                    availableQuantityLabel.setVisible(false);
                }))

                .exceptionally(e -> {
                    String errorMessage = extractErrorMessage(e);
                    Platform.runLater(() ->
                            showStatus("❌ Erro ao processar saída: " + errorMessage, "error")
                    );
                    return null;
                });


    }




    private void showAlert(Alert.AlertType type, String title, String message) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
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

}