package com.example.view;

import com.example.model.Bloodstock;
import com.example.model.CompanyDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.print.PrinterJob;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.stage.DirectoryChooser;
import javafx.stage.Stage;
import javafx.util.StringConverter;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Table;

import java.io.File;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class BloodstockForm extends Application {

    private static final String BASE_URL = "http://localhost:8080/api/stock";
    private static final String COMPANY_URL = "http://localhost:8080/api/company";

    private VBox dashboardContainer; // variável de instância correta
    private ComboBox<CompanyDTO> companyComboBox;
    private ComboBox<String> bloodComboBox;
    private TextField quantityField;
    private Button submitButton;
    private Label statusLabel;
    private Label selectionLabel;
    private TableView<Bloodstock> tableView;
    private String selectedMovementType = null;


    @Override
    public void start(Stage stage) {
        companyComboBox = new ComboBox<>();
        bloodComboBox = new ComboBox<>(FXCollections.observableArrayList("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"));
        quantityField = new TextField();
        submitButton = new Button("Enviar");
        statusLabel = new Label();
        selectionLabel = new Label();
        tableView = new TableView<>();
        dashboardContainer = new VBox();

        Label movementLabel = new Label("Selecione o tipo de movimentação:");
        Button entradaButton = new Button("Entrada");
        Button saidaButton = new Button("Saída");

        entradaButton.setStyle("-fx-background-color: #43a047; -fx-text-fill: white; -fx-font-weight: bold;");
        saidaButton.setStyle("-fx-background-color: #e53935; -fx-text-fill: white; -fx-font-weight: bold;");

        HBox movementButtons = new HBox(10, entradaButton, saidaButton);
        movementButtons.setAlignment(Pos.CENTER);

    // Campo de quantidade inicialmente invisível
        quantityField.setVisible(false);

    // Label para indicar o tipo selecionado
        Label selectedMovementLabel = new Label();
        selectedMovementLabel.setStyle("-fx-font-weight: bold;");

    // Ação dos botões
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



        setupCompanyComboBox();
        setupBloodComboBox();
        setupSubmitButton();
        setupTableView();

        // Botão de relatório
        Button reportButton = new Button("Gerar Relatório");
        reportButton.setStyle("-fx-background-color: #1976d2; -fx-text-fill: white; -fx-font-weight: bold;");
        reportButton.setOnAction(e -> {
            showPreview(buildReportContent());
        });

        VBox root = new VBox(15, dashboardContainer,movementLabel, movementButtons, selectedMovementLabel, reportButton, companyComboBox, bloodComboBox, quantityField, submitButton, statusLabel, selectionLabel, tableView);
        root.setPadding(new Insets(20));
        root.setStyle("-fx-background-color: white;");

        Scene scene = new Scene(root, 600, 600);
        stage.setTitle("Cadastro de Estoque de Sangue");
        stage.setScene(scene);
        stage.show();

        loadCompanies();
    }


    private void setupCompanyComboBox() {
        companyComboBox.setPromptText("Selecione a empresa");
        companyComboBox.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(CompanyDTO item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? null : item.getInstitutionName());
            }
        });

        companyComboBox.setConverter(new StringConverter<>() {
            @Override
            public String toString(CompanyDTO company) {
                return company == null ? null : company.getInstitutionName();
            }
            @Override
            public CompanyDTO fromString(String string) { return null; }
        });

        companyComboBox.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) loadStockForCompany(newVal.getId());
            else tableView.getItems().clear();
        });
    }

    private void setupBloodComboBox() {
        bloodComboBox.setPromptText("Selecione o tipo sanguíneo");
        bloodComboBox.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) selectionLabel.setText("Você selecionou: " + newVal);
        });
    }

    private void setupSubmitButton() {
        submitButton.setStyle("-fx-background-color: #d32f2f; -fx-text-fill: white; -fx-font-weight: bold;");
        submitButton.setOnAction(e -> sendBloodstock());
    }

    private void setupTableView() {
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

    private void loadStockForCompany(UUID companyId) {
        new Thread(() -> {
            try {
                URL url = new URL(BASE_URL + "/company/" + companyId);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("Accept", "application/json");

                if (conn.getResponseCode() != 200)
                    throw new RuntimeException("HTTP error: " + conn.getResponseCode());

                ObjectMapper mapper = new ObjectMapper();
                mapper.registerModule(new JavaTimeModule());
                Bloodstock[] stocks = mapper.readValue(conn.getInputStream(), Bloodstock[].class);

                Platform.runLater(() -> {
                    List<Bloodstock> stockList = List.of(stocks);
                    tableView.getItems().setAll(stockList);
                    showBloodstockDashboard(stockList, dashboardContainer, tableView);
                });
            } catch (Exception e) {
                e.printStackTrace();
                Platform.runLater(() -> {
                    tableView.getItems().clear();
                    showBloodstockDashboard(List.of(), dashboardContainer, tableView);
                });
            }
        }).start();
    }

    private void sendBloodstock() {
        CompanyDTO selectedCompany = companyComboBox.getSelectionModel().getSelectedItem();
        String selectedBloodType = bloodComboBox.getSelectionModel().getSelectedItem();

        if (selectedCompany == null) { showError("Selecione uma empresa!"); return; }
        if (selectedBloodType == null) { showError("Selecione um tipo sanguíneo!"); return; }

        String movementType = selectedMovementType;
        if (movementType == null) {
            showError("Selecione Entrada ou Saída antes de continuar!");
            return;
        }


        new Thread(() -> {
            try {
                int movement = Integer.parseInt(quantityField.getText());
                // se for saída, transforma em negativo
                if ("Saída".equals(movementType)) {
                    movement = -movement;
                }
                if (movement == 0) { showError("Quantidade não pode ser zero!"); return; }

                UUID companyId = selectedCompany.getId();

                // Verificar se já existe o Bloodstock no TableView
                Bloodstock existingStock = tableView.getItems().stream()
                        .filter(b -> selectedBloodType.equals(b.getBloodType()))
                        .findFirst()
                        .orElse(null);

                if (existingStock != null) {
                    // Atualiza localmente antes de enviar
                    existingStock.setQuantity(existingStock.getQuantity() + movement);
                    existingStock.setUpdateDate(LocalDate.now());
                    tableView.refresh();
                } else {
                    showError("Estoque não encontrado para este tipo sanguíneo!");
                    return;
                }
                Platform.runLater(() -> showBloodstockDashboard(tableView.getItems(), dashboardContainer, tableView));


                // Preparar JSON para envio
                Map<String, Object> data = new HashMap<>();
                data.put("bloodstockId", existingStock.getId().toString());
                data.put("quantity", movement);

                ObjectMapper mapper = new ObjectMapper();
                mapper.registerModule(new JavaTimeModule());
                String json = mapper.writeValueAsString(data);

                // Criar HttpClient e enviar POST
                HttpClient client = HttpClient.newHttpClient();
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(BASE_URL + "/company/" + companyId + "/movement"))
                        .POST(HttpRequest.BodyPublishers.ofString(json))
                        .header("Content-Type", "application/json")
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

                Platform.runLater(() -> {
                    if (response.statusCode() == 200 || response.statusCode() == 201) {
                        statusLabel.setText("Estoque atualizado com sucesso!");
                        statusLabel.setStyle("-fx-text-fill: green;");
                        loadStockForCompany(companyId);
                    } else {
                        showError("Erro ao atualizar: " + response.statusCode());
                    }
                });

            } catch (NumberFormatException nfe) {
                showError("Digite um número válido!");
            } catch (Exception ex) {
                ex.printStackTrace();
                showError(ex.getMessage());
            }



        }).start();
    }




    private void showError(String message) {
        Platform.runLater(() -> {
            statusLabel.setText("Erro: " + message);
            statusLabel.setStyle("-fx-text-fill: red;");
        });
    }

    private String buildReportContent() {
        StringBuilder sb = new StringBuilder();
        CompanyDTO company = companyComboBox.getSelectionModel().getSelectedItem();
        sb.append("Relatório de Estoque de Sangue\n");
        sb.append("Empresa: ").append(company != null ? company.getInstitutionName() : "").append("\n\n");
        sb.append(String.format("%-15s %-10s %-15s\n", "Tipo Sanguíneo", "Quantidade", "Última Alteração"));
        sb.append("-------------------------------------------------\n");
        for (Bloodstock b : tableView.getItems()) {
            sb.append(String.format("%-15s %-10d %-15s\n",
                    b.getBloodType() != null ? b.getBloodType() : "",
                    b.getQuantity(),
                    b.getUpdateDate() != null ? b.getUpdateDate().toString() : ""));
        }
        return sb.toString();
    }

    private void showPreview(String reportContent) {
        Stage previewStage = new Stage();
        previewStage.setTitle("Pré-visualização do Relatório");

        TableView<Bloodstock> reportTable = new TableView<>();
        reportTable.setItems(FXCollections.observableArrayList(tableView.getItems()));

        TableColumn<Bloodstock, String> bloodTypeCol = new TableColumn<>("Tipo Sanguíneo");
        bloodTypeCol.setCellValueFactory(new PropertyValueFactory<>("bloodType"));

        TableColumn<Bloodstock, Integer> quantityCol = new TableColumn<>("Quantidade");
        quantityCol.setCellValueFactory(new PropertyValueFactory<>("quantity"));

        TableColumn<Bloodstock, LocalDate> dateCol = new TableColumn<>("Última Alteração");
        dateCol.setCellValueFactory(new PropertyValueFactory<>("updateDate"));

        reportTable.getColumns().setAll(bloodTypeCol, quantityCol, dateCol);
        reportTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        reportTable.setPrefHeight(300);

        Button printButton = new Button("Imprimir");
        Button pdfButton = new Button("Gerar PDF");

        printButton.setOnAction(e -> printReportFromTable(reportTable));
        pdfButton.setOnAction(e -> generatePdfFromTable(reportTable));

        HBox buttons = new HBox(10, printButton, pdfButton);
        buttons.setAlignment(Pos.CENTER);

        VBox root = new VBox(10, reportTable, buttons);
        root.setPadding(new Insets(10));

        Scene scene = new Scene(root, 600, 400);
        previewStage.setScene(scene);
        previewStage.show();
    }

    private void printReportFromTable(TableView<Bloodstock> reportTable) {
        PrinterJob job = PrinterJob.createPrinterJob();
        if (job != null && job.showPrintDialog(null)) {
            boolean success = job.printPage(reportTable);
            if (success) job.endJob();
        }
    }

    private void generatePdfFromTable(TableView<Bloodstock> reportTable) {
        try {
            DirectoryChooser directoryChooser = new DirectoryChooser();
            directoryChooser.setTitle("Escolha o diretório para salvar o PDF");
            File selectedDirectory = directoryChooser.showDialog(reportTable.getScene().getWindow());

            if (selectedDirectory != null) {
                String filePath = selectedDirectory.getAbsolutePath() + File.separator + "relatorio.pdf";
                PdfWriter writer = new PdfWriter(filePath);
                PdfDocument pdfDoc = new PdfDocument(writer);
                Document document = new Document(pdfDoc);

                document.add(new Paragraph("Relatório de Estoque de Sangue").setBold().setFontSize(16));
                CompanyDTO company = companyComboBox.getSelectionModel().getSelectedItem();
                document.add(new Paragraph("Empresa: " + (company != null ? company.getInstitutionName() : "")));
                document.add(new Paragraph("Data: " + LocalDate.now()));
                document.add(new Paragraph(" "));

                float[] columnWidths = {4, 2, 3};
                Table table = new Table(columnWidths);

                table.addHeaderCell(new Cell().add(new Paragraph("Tipo Sanguíneo").setBold()));
                table.addHeaderCell(new Cell().add(new Paragraph("Quantidade").setBold()));
                table.addHeaderCell(new Cell().add(new Paragraph("Última Alteração").setBold()));

                for (Bloodstock b : reportTable.getItems()) {
                    table.addCell(new Cell().add(new Paragraph(b.getBloodType() != null ? b.getBloodType() : "")));
                    table.addCell(new Cell().add(new Paragraph(String.valueOf(b.getQuantity()))));
                    table.addCell(new Cell().add(new Paragraph(b.getUpdateDate() != null ? b.getUpdateDate().toString() : "")));
                }

                document.add(table);
                document.close();

                Alert alert = new Alert(Alert.AlertType.INFORMATION, "PDF gerado com sucesso em:\n" + filePath);
                alert.showAndWait();
            } else {
                new Alert(Alert.AlertType.WARNING, "Operação cancelada pelo usuário.").showAndWait();
            }

        } catch (Exception ex) {
            ex.printStackTrace();
            new Alert(Alert.AlertType.ERROR, "Erro ao gerar PDF: " + ex.getMessage()).showAndWait();
        }
    }

    private void showBloodstockDashboard(List<Bloodstock> bloodstockList, VBox overviewContainer, TableView<Bloodstock> tableView) {
        overviewContainer.getChildren().clear();
        FlowPane flowPane = new FlowPane();
        flowPane.setHgap(15);
        flowPane.setVgap(15);
        flowPane.setPrefWrapLength(550);

        for (Bloodstock b : bloodstockList) {
            VBox card = new VBox(8);
            card.setPadding(new Insets(10));
            card.setStyle("-fx-border-color: #ccc; -fx-border-radius: 5; -fx-background-radius: 5; -fx-background-color: #f9f9f9;");
            card.setPrefWidth(140);
            card.setAlignment(Pos.CENTER);

            Label typeLabel = new Label(b.getBloodType());
            typeLabel.setStyle("-fx-font-weight: bold; -fx-font-size: 14px;");

            Label quantityLabel = new Label(b.getQuantity() + " unidades");

            StackPane progressPane = new StackPane();
            ProgressBar progress = new ProgressBar();
            progress.setPrefWidth(120);
            double progressValue = b.getQuantity() / 100.0;
            progress.setProgress(Math.min(progressValue, 1));

            if (progressValue > 1) {
                progress.setStyle("-fx-accent: orange;");
            } else if (progressValue < 0.3) {
                progress.setStyle("-fx-accent: red;");
            } else {
                progress.setStyle("-fx-accent: #76FF03;");
            }

            Label percentLabel = new Label(String.format("%.0f%%", Math.min(progressValue * 100, 100)));
            percentLabel.setStyle("-fx-font-weight: bold; -fx-text-fill: black;");
            progressPane.getChildren().addAll(progress, percentLabel);

            Tooltip tooltip = new Tooltip(
                    "Última atualização: " + (b.getUpdateDate() != null ? b.getUpdateDate() : "N/A") +
                            "\nEmpresa: " + (companyComboBox.getSelectionModel().getSelectedItem() != null ?
                            companyComboBox.getSelectionModel().getSelectedItem().getInstitutionName() : "N/A")
            );
            Tooltip.install(card, tooltip);

            card.setOnMouseClicked(event -> {
                tableView.getSelectionModel().select(b);
                tableView.scrollTo(b);
            });

            card.getChildren().addAll(typeLabel, quantityLabel, progressPane);
            card.setOnMouseEntered(e -> card.setStyle("-fx-background-color: #e0f7fa; -fx-border-color: #00acc1; -fx-border-radius: 5; -fx-background-radius: 5;"));
            card.setOnMouseExited(e -> card.setStyle("-fx-background-color: #f9f9f9; -fx-border-color: #ccc; -fx-border-radius: 5; -fx-background-radius: 5;"));

            flowPane.getChildren().add(card);
        }

        overviewContainer.getChildren().add(flowPane);
    }

    private void loadCompanies() { new Thread(() -> { try { URL url = new URL(COMPANY_URL); HttpURLConnection conn = (HttpURLConnection) url.openConnection(); conn.setRequestMethod("GET"); conn.setRequestProperty("Accept", "application/json"); if (conn.getResponseCode() != 200) throw new RuntimeException("HTTP error: " + conn.getResponseCode()); ObjectMapper mapper = new ObjectMapper(); mapper.registerModule(new JavaTimeModule()); CompanyDTO[] companies = mapper.readValue(conn.getInputStream(), CompanyDTO[].class); Platform.runLater(() -> { companyComboBox.getItems().setAll(companies); if (!companyComboBox.getItems().isEmpty()) companyComboBox.getSelectionModel().selectFirst(); }); } catch (Exception e) { e.printStackTrace(); Platform.runLater(() -> companyComboBox.getItems().clear()); } }).start(); }

    public static void main(String[] args) {
        launch();
    }
}
