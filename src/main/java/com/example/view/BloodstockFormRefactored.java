package com.example.view;

import com.example.model.Bloodstock;
import com.example.model.BloodstockMovement;
import com.example.model.CompanyDTO;
import com.example.view.controller.BloodstockViewController;
import javafx.application.Application;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import javafx.util.StringConverter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * View refatorada seguindo o padrão MVC.
 * Responsável apenas pela interface gráfica e interação com o usuário.
 */
public class BloodstockFormRefactored extends Application {

    // Controller MVC
    private final BloodstockViewController controller = new BloodstockViewController();

    // Componentes da UI
    private ComboBox<CompanyDTO> companyComboBox;
    private ComboBox<String> bloodComboBox;
    private TextField quantityField;
    private Button submitButton;
    private Label statusLabel;
    private Label selectionLabel;
    private TableView<Bloodstock> tableView;
    private String selectedMovementType = null;
    private VBox dashboardContainer;

    @Override
    public void start(Stage stage) {
        // Inicializar componentes
        initializeComponents();

        // Configurar componentes
        setupCompanyComboBox();
        setupBloodComboBox();
        setupSubmitButton();
        setupTableView();

        // Criar seção de movimentação
        VBox movementSection = createMovementSection();

        // Criar botões de relatório
        HBox reportButtons = createReportButtons();

        // Layout principal
        VBox root = new VBox(15,
                dashboardContainer,
                reportButtons,
                movementSection,
                companyComboBox,
                bloodComboBox,
                quantityField,
                submitButton,
                statusLabel,
                selectionLabel,
                tableView);

        root.setPadding(new Insets(20));
        root.setStyle("-fx-background-color: white;");
        root.setAlignment(Pos.TOP_CENTER);

        // Adicionar barra de rolagem
        ScrollPane scrollPane = new ScrollPane(root);
        scrollPane.setFitToWidth(true);
        scrollPane.setHbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        scrollPane.setVbarPolicy(ScrollPane.ScrollBarPolicy.AS_NEEDED);
        scrollPane.setStyle("-fx-background-color: white; -fx-border-color: transparent;");

        // Criar cena e carregar CSS
        Scene scene = new Scene(scrollPane, 430, 700);
        try {
            scene.getStylesheets().add(getClass().getResource("/style.css").toExternalForm());
        } catch (Exception e) {
            System.err.println("Aviso: Não foi possível carregar o arquivo CSS: " + e.getMessage());
        }

        stage.setTitle("Controle de Estoque de Sangue");
        stage.setScene(scene);
        stage.setResizable(false);
        stage.show();

        // Carregar dados iniciais
        loadCompanies();
    }

    private void initializeComponents() {
        companyComboBox = new ComboBox<>();
        bloodComboBox = new ComboBox<>(FXCollections.observableArrayList(
                "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"));
        quantityField = new TextField();
        submitButton = new Button("Enviar");
        statusLabel = new Label();
        selectionLabel = new Label();
        tableView = new TableView<>();
        dashboardContainer = new VBox();
    }

    private VBox createMovementSection() {
        String buttonStyle = "-fx-background-radius: 8; -fx-font-weight: bold; -fx-font-size: 13px; "
                + "-fx-text-fill: white; -fx-pref-width: 150; -fx-pref-height: 35;";

        Label movementLabel = new Label("Selecione o tipo de movimentação:");
        Button entradaButton = new Button("Entrada");
        Button saidaButton = new Button("Saída");

        entradaButton.setStyle(buttonStyle + "-fx-background-color: #43a047;");
        saidaButton.setStyle(buttonStyle + "-fx-background-color: #e53935;");

        HBox movementButtons = new HBox(10, entradaButton, saidaButton);
        movementButtons.setAlignment(Pos.CENTER);

        quantityField.setVisible(false);
        quantityField.setPromptText("Quantidade");

        Label selectedMovementLabel = new Label();
        selectedMovementLabel.setStyle("-fx-font-weight: bold;");

        entradaButton.setOnAction(e -> {
            selectedMovementType = "Entrada";
            selectedMovementLabel.setText("Movimentação: Entrada");
            quantityField.setVisible(true);
        });

        saidaButton.setOnAction(e -> {
            selectedMovementType = "Saída";
            selectedMovementLabel.setText("Movimentação: Saída");
            quantityField.setVisible(true);
        });

        return new VBox(10, movementLabel, movementButtons, selectedMovementLabel);
    }

    private HBox createReportButtons() {
        Button stockReportButton = new Button("Gerar Relatório do Estoque");
        stockReportButton.setStyle("-fx-background-color: #00796b; -fx-text-fill: white; -fx-font-weight: bold;");
        stockReportButton.setOnAction(e -> generateStockReport());

        Button historyReportButton = new Button("Gerar Relatório do Histórico");
        historyReportButton.setStyle("-fx-background-color: #0288d1; -fx-text-fill: white; -fx-font-weight: bold;");
        historyReportButton.setOnAction(e -> generateHistoryReport());

        HBox buttons = new HBox(10, stockReportButton, historyReportButton);
        buttons.setAlignment(Pos.CENTER);
        return buttons;
    }

    private void setupCompanyComboBox() {
        companyComboBox.setPromptText("Selecione uma empresa");
        companyComboBox.setItems(controller.getCompanies());

        companyComboBox.setConverter(new StringConverter<>() {
            @Override
            public String toString(CompanyDTO company) {
                return company == null ? null : company.getInstitutionName();
            }

            @Override
            public CompanyDTO fromString(String string) {
                return null;
            }
        });

        companyComboBox.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) {
                loadStockForCompany(newVal.getId());
            } else {
                tableView.getItems().clear();
            }
        });
    }

    private void setupBloodComboBox() {
        bloodComboBox.setPromptText("Selecione o tipo sanguíneo");
        bloodComboBox.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) {
                selectionLabel.setText("Você selecionou: " + newVal);
            }
        });
    }

    private void setupSubmitButton() {
        submitButton.setStyle("-fx-background-color: #d32f2f; -fx-text-fill: white; -fx-font-weight: bold;");
        submitButton.setOnAction(e -> processMovement());
    }

    private void setupTableView() {
        tableView.setItems(controller.getBloodstockList());

        TableColumn<Bloodstock, String> bloodTypeColumn = new TableColumn<>("Tipo Sanguíneo");
        bloodTypeColumn.setCellValueFactory(new PropertyValueFactory<>("bloodType"));

        TableColumn<Bloodstock, Integer> quantityColumn = new TableColumn<>("Quantidade");
        quantityColumn.setCellValueFactory(new PropertyValueFactory<>("quantity"));

        TableColumn<Bloodstock, LocalDate> dateColumn = new TableColumn<>("Última Alteração");
        dateColumn.setCellValueFactory(new PropertyValueFactory<>("updateDate"));

        tableView.getColumns().setAll(bloodTypeColumn, quantityColumn, dateColumn);
        tableView.setPrefHeight(150);
        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
    }

    // ==================== Métodos de ação ====================

    private void loadCompanies() {
        controller.loadCompanies(this::showError);
    }

    private void loadStockForCompany(java.util.UUID companyId) {
        controller.loadBloodstockByCompany(companyId, this::showError);
    }

    private void processMovement() {
        CompanyDTO selectedCompany = companyComboBox.getValue();
        String selectedBloodType = bloodComboBox.getValue();
        String quantityText = quantityField.getText();

        // Validações básicas
        if (selectedCompany == null) {
            showError("Selecione uma empresa!");
            return;
        }

        if (selectedBloodType == null) {
            showError("Selecione um tipo sanguíneo!");
            return;
        }

        if (quantityText == null || quantityText.trim().isEmpty()) {
            showError("Informe a quantidade!");
            return;
        }

        try {
            int quantity = Integer.parseInt(quantityText.trim());

            controller.processMovement(
                    selectedMovementType,
                    selectedCompany.getId(),
                    selectedBloodType,
                    quantity,
                    this::showSuccess,
                    this::showError
            );

            // Limpar campos após sucesso
            quantityField.clear();
            bloodComboBox.getSelectionModel().clearSelection();
            selectedMovementType = null;
            quantityField.setVisible(false);

        } catch (NumberFormatException e) {
            showError("Quantidade inválida! Digite apenas números.");
        }
    }

    private void generateStockReport() {
        CompanyDTO selectedCompany = companyComboBox.getValue();
        if (selectedCompany == null) {
            showError("Selecione uma empresa antes de gerar o relatório!");
            return;
        }

        // Gerar relatório com os dados atuais da tabela
        StringBuilder report = new StringBuilder();
        report.append("=== RELATÓRIO DE ESTOQUE ===\n\n");
        report.append("Empresa: ").append(selectedCompany.getInstitutionName()).append("\n");
        report.append("Data: ").append(LocalDateTime.now()).append("\n\n");
        report.append("Tipo Sanguíneo | Quantidade\n");
        report.append("--------------------------------\n");

        for (Bloodstock b : tableView.getItems()) {
            report.append(String.format("%-15s | %d\n", b.getBloodType(), b.getQuantity()));
        }

        showInfo("Relatório de Estoque", report.toString());
    }

    private void generateHistoryReport() {
        CompanyDTO selectedCompany = companyComboBox.getValue();
        if (selectedCompany == null) {
            showError("Selecione uma empresa antes de gerar o relatório!");
            return;
        }

        controller.loadHistoryByCompany(
                selectedCompany.getId(),
                this::showHistoryPreview,
                this::showError
        );
    }

    private void showHistoryPreview(List<BloodstockMovement> historyList) {
        Stage previewStage = new Stage();
        previewStage.setTitle("Histórico de Movimentações");

        TableView<BloodstockMovement> historyTable = new TableView<>();
        historyTable.setItems(FXCollections.observableArrayList(historyList));

        TableColumn<BloodstockMovement, String> typeCol = new TableColumn<>("Tipo Sanguíneo");
        typeCol.setCellValueFactory(c -> new javafx.beans.property.SimpleStringProperty(
                c.getValue().getBloodstock() != null ? c.getValue().getBloodstock().getBloodType() : "-"
        ));

        TableColumn<BloodstockMovement, Integer> movementCol = new TableColumn<>("Movimentação");
        movementCol.setCellValueFactory(new PropertyValueFactory<>("movement"));

        TableColumn<BloodstockMovement, Integer> beforeCol = new TableColumn<>("Antes");
        beforeCol.setCellValueFactory(new PropertyValueFactory<>("quantityBefore"));

        TableColumn<BloodstockMovement, Integer> afterCol = new TableColumn<>("Depois");
        afterCol.setCellValueFactory(new PropertyValueFactory<>("quantityAfter"));

        TableColumn<BloodstockMovement, String> userCol = new TableColumn<>("Usuário");
        userCol.setCellValueFactory(new PropertyValueFactory<>("actionBy"));

        TableColumn<BloodstockMovement, LocalDateTime> dateCol = new TableColumn<>("Data");
        dateCol.setCellValueFactory(new PropertyValueFactory<>("actionDate"));

        historyTable.getColumns().setAll(typeCol, movementCol, beforeCol, afterCol, userCol, dateCol);
        historyTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        historyTable.setPrefHeight(400);

        VBox root = new VBox(10, historyTable);
        root.setPadding(new Insets(10));

        Scene scene = new Scene(root, 700, 450);
        previewStage.setScene(scene);
        previewStage.show();
    }

    // ==================== Métodos auxiliares ====================

    private void showError(String message) {
        statusLabel.setText("❌ " + message);
        statusLabel.setStyle("-fx-text-fill: red; -fx-font-weight: bold;");
        BloodstockViewController.showAlert(message);
    }

    private void showSuccess(String message) {
        statusLabel.setText("✅ " + message);
        statusLabel.setStyle("-fx-text-fill: green; -fx-font-weight: bold;");
        BloodstockViewController.showSuccess(message);
    }

    private void showInfo(String title, String content) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.showAndWait();
    }

    public static void main(String[] args) {
        launch(args);
    }
}