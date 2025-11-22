package com.example.view;

import com.example.dto.response.CompanyDTO;
import com.example.entity.BloodstockMovement;
import com.example.view.controller.BloodstockViewController;
import com.example.dto.response.BloodstockDTO;
import javafx.animation.*;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.print.PrinterJob;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.image.Image;
import javafx.scene.layout.*;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.util.Duration;
import javafx.util.StringConverter;
import javafx.collections.ListChangeListener;
import java.net.URL;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class BloodstockFormRefactored extends Application {

    private final BloodstockViewController controller = new BloodstockViewController();

    private ComboBox<CompanyDTO> companyComboBox;
    private ComboBox<String> bloodComboBox;
    private TextField quantityField;
    private Button submitButton;
    private Label statusLabel;
    private String selectedMovementType = null;

    private Stage primaryStage;

    private TableView<BloodstockDTO> tableView;

    // refs para os cards
    private final Map<String, ProgressBar> bloodBars = new HashMap<>();
    private final Map<String, Label> bloodLabels = new HashMap<>();
    private final Map<String, VBox> bloodCards = new HashMap<>();

    @Override
    public void start(Stage stage) {
        BorderPane mainLayout = new BorderPane();
        mainLayout.getStyleClass().add("main-container");
        stage.getIcons().add(new Image(getClass().getResourceAsStream("/icon.png")));

        VBox header = createHeader();
        mainLayout.setTop(header);

        VBox content = createContentArea();
        ScrollPane scroll = new ScrollPane(content);
        scroll.setFitToWidth(true);
        scroll.setHbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        scroll.getStyleClass().add("content-scroll");
        mainLayout.setCenter(scroll);

        Scene scene = new Scene(mainLayout, 1000, 750);
        URL cssUrl = getClass().getResource("/style.css");
        if (cssUrl != null) scene.getStylesheets().add(cssUrl.toExternalForm());

        stage.setTitle("Sistema de Gestão de Estoque Sanguíneo");
        stage.setScene(scene);
        stage.setResizable(true);
        stage.show();

        loadCompanies();
        startAutoRefresh();
        attachObservers();
    }

    /** Observers para sincronizar UI com dados do controller */
    private void attachObservers() {
        // Quando a lista de empresas chegar do backend, seleciona a primeira
        controller.getCompanies().addListener((ListChangeListener<CompanyDTO>) change -> {
            if (!controller.getCompanies().isEmpty() && companyComboBox.getValue() == null) {
                // seleciona a primeira empresa automaticamente
                companyComboBox.getSelectionModel().selectFirst();
            }
        });

        // Sempre que a lista observável de estoque mudar, atualiza os 8 cards
        controller.getBloodstockList().addListener((ListChangeListener<BloodstockDTO>) change -> {
            Platform.runLater(this::refreshBloodCards);
            // A TableView já está ligada a controller.getBloodstockList()
            // então a tabela atualiza sozinha.
        });
    }

    private VBox createHeader() {
        VBox header = new VBox(10);
        header.getStyleClass().add("header");
        header.setPadding(new Insets(20));

        Label title = new Label(" Sistema de Gestão de Estoque Sanguíneo");
        title.getStyleClass().add("header-title");

        Label subtitle = new Label("Monitoramento e movimentação de bolsas de sangue");
        subtitle.getStyleClass().add("header-subtitle");

        header.getChildren().addAll(title, subtitle);
        return header;
    }

    private VBox createContentArea() {
        VBox content = new VBox(22);
        content.setPadding(new Insets(28));
        content.getStyleClass().add("content-area");

        content.getChildren().addAll(
                createBloodCardsSection(),
                createFormSection(),
                createTableSection(),
                createReportsSection()
        );
        return content;
    }

    /* ==================== CARDS DE SANGUE ==================== */
    private VBox createBloodCardsSection() {
        VBox container = new VBox(12);
        container.getStyleClass().add("summary-section");

        Label sectionTitle = new Label(" Estoque por Tipo Sanguíneo");
        sectionTitle.getStyleClass().add("section-title");

        GridPane grid = new GridPane();
        grid.setHgap(18);
        grid.setVgap(18);
        grid.setAlignment(Pos.CENTER);

        List<String> bloodTypes = Arrays.asList("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-");
        int col = 0, row = 0;

        for (String type : bloodTypes) {
            VBox card = createBloodCard(type);
            bloodCards.put(type, card);
            grid.add(card, col, row);
            col++;
            if (col > 3) { col = 0; row++; }
        }

        container.getChildren().addAll(sectionTitle, grid);
        return container;
    }

    private VBox createBloodCard(String type) {
        VBox card = new VBox(10);
        card.getStyleClass().add("blood-card");
        card.setAlignment(Pos.CENTER);
        card.setPrefWidth(180);
        card.setPadding(new Insets(14));

        Label typeLabel = new Label(type);
        typeLabel.getStyleClass().add("blood-type-label");

        Label quantityLabel = new Label("0 bolsas");
        quantityLabel.getStyleClass().add("blood-quantity-label");

        ProgressBar bar = new ProgressBar(0);
        bar.setPrefWidth(140);
        bar.setPrefHeight(10);
        bar.getStyleClass().add("blood-bar");

        Label status = new Label("Sem dados");
        status.getStyleClass().add("blood-status-label");

        card.getChildren().addAll(typeLabel, quantityLabel, bar, status);

        bloodBars.put(type, bar);
        bloodLabels.put(type, quantityLabel);
        return card;
    }

    /* ==================== FORM / MOVIMENTAÇÃO ==================== */
    private VBox createFormSection() {
        VBox section = new VBox(18);
        section.getStyleClass().add("form-section");
        section.setAlignment(Pos.CENTER);

        Label title = new Label("Registrar Movimentação");
        title.getStyleClass().add("section-title");

        VBox movementBox = createMovementSelector();

        GridPane grid = new GridPane();
        grid.setAlignment(Pos.CENTER);
        grid.setHgap(24);
        grid.setVgap(14);
        grid.getStyleClass().add("form-grid");

        initializeFormComponents();

        VBox companyBox = createFormField("Empresa", companyComboBox);
        VBox bloodBox = createFormField("Tipo Sanguíneo", bloodComboBox);
        VBox quantityBox = createFormField("Quantidade", quantityField);

        grid.add(companyBox, 0, 0);
        grid.add(bloodBox, 1, 0);
        grid.add(quantityBox, 0, 1);
        grid.add(submitButton, 1, 1);

        statusLabel = new Label();
        statusLabel.getStyleClass().add("status-label");
        statusLabel.setVisible(false);

        section.getChildren().addAll(title, movementBox, grid, statusLabel);
        return section;
    }

    private VBox createFormField(String label, Control control) {
        VBox box = new VBox(6);
        Label lbl = new Label(label);
        lbl.getStyleClass().add("field-label");
        box.getChildren().addAll(lbl, control);
        return box;
    }

    private void initializeFormComponents() {
        companyComboBox = new ComboBox<>();
        companyComboBox.setPromptText("Selecione uma empresa");
        companyComboBox.getStyleClass().add("modern-combo");
        setupCompanyComboBox();

        bloodComboBox = new ComboBox<>(FXCollections.observableArrayList(
                "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
        ));
        bloodComboBox.setPromptText("Selecione o tipo");
        bloodComboBox.getStyleClass().add("modern-combo");

        quantityField = new TextField();
        quantityField.setPromptText("Ex: 10");
        quantityField.getStyleClass().add("modern-field");
        quantityField.setVisible(false);

        submitButton = new Button("Registrar Movimentação");
        submitButton.getStyleClass().add("primary-button");
        submitButton.setDisable(true);
        submitButton.setOnAction(e -> processMovement());
    }

    private VBox createMovementSelector() {
        VBox box = new VBox(8);
        box.setAlignment(Pos.CENTER);

        Label label = new Label("Selecione o tipo de movimentação:");
        label.getStyleClass().add("field-label");

        HBox buttons = new HBox(16);
        buttons.setAlignment(Pos.CENTER);

        Button entradaLote = new Button("➕ Entrada Lote");
        entradaLote.getStyleClass().addAll("movement-button", "entrada-button");

        Button saidaLote = new Button("➖ Saída Lote");
        saidaLote.getStyleClass().addAll("movement-button", "saida-button");
        buttons.setAlignment(Pos.CENTER);

        Button entrada = new Button("⬆ Entrada");
        entrada.getStyleClass().addAll("movement-button", "entrada-button");

        Button saida = new Button("⬇ Saída");
        saida.getStyleClass().addAll("movement-button", "saida-button");

        entrada.setOnAction(e -> {
            selectedMovementType = "Entrada";
            quantityField.setVisible(true);
            submitButton.setDisable(false);
            submitButton.setText("🔼 Registrar Entrada");
            entrada.getStyleClass().add("active");
            saida.getStyleClass().remove("active");
            entradaLote.getStyleClass().remove("active");
            saidaLote.getStyleClass().remove("active");
        });


        entradaLote.setOnAction(e -> {
            CompanyDTO selectedCompany = companyComboBox.getValue();
            if (selectedCompany != null) {
                new BatchEntryForm(
                        primaryStage,
                        controller.getApiService(),
                        selectedCompany.getId(),
                        (id) -> refreshAll(selectedCompany.getId())
                ).show();
            } else {
                showError("Selecione uma empresa para realizar a entrada por lote.");
            }
        });

        saida.setOnAction(e -> {
            selectedMovementType = "Saída";
            quantityField.setVisible(true);
            submitButton.setDisable(false);
            submitButton.setText("🔽 Registrar Saída");
            saida.getStyleClass().add("active");
            entrada.getStyleClass().remove("active");
            entradaLote.getStyleClass().remove("active");
            saidaLote.getStyleClass().remove("active");
        });

        saidaLote.setOnAction(e -> {
            CompanyDTO selectedCompany = companyComboBox.getValue();
            if (selectedCompany != null) {
                new com.example.view.service.BatchExitBulkForm(
                        primaryStage,
                        controller.getApiService(),
                        selectedCompany.getId(),
                        () -> refreshAll(selectedCompany.getId())

                ).show();
            } else {
                showError("Selecione uma empresa para realizar a saída por lote.");
            }
        });

        buttons.getChildren().addAll(entrada, entradaLote, saida, saidaLote);
        box.getChildren().addAll(label, buttons);
        return box;
    }

    /* ==================== TABELA ==================== */
    private VBox createTableSection() {
        VBox section = new VBox(12);
        section.getStyleClass().add("table-section");

        Label title = new Label("Estoque Detalhado");
        title.getStyleClass().add("section-title");

        tableView = new TableView<>();
        tableView.getStyleClass().add("modern-table");
        setupTableView();

        section.getChildren().addAll(title, tableView);
        return section;
    }

    private void setupTableView() {
        tableView.setItems(controller.getBloodstockList());

        TableColumn<BloodstockDTO, String> typeCol = new TableColumn<>("Tipo");
        typeCol.setCellValueFactory(new PropertyValueFactory<>("bloodType"));
        typeCol.setPrefWidth(120);

        TableColumn<BloodstockDTO, Integer> qtyCol = new TableColumn<>("Quantidade");
        qtyCol.setCellValueFactory(new PropertyValueFactory<>("quantity"));
        qtyCol.setPrefWidth(140);
        qtyCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(Integer value, boolean empty) {
                super.updateItem(value, empty);
                if (empty || value == null) {
                    setText(null);
                    setGraphic(null);
                } else {
                    Label chip = new Label(value + " un.");
                    chip.getStyleClass().add("qty-chip");
                    setGraphic(chip);
                    setText(null);
                }
            }
        });

        TableColumn<BloodstockDTO, LocalDate> dateCol = new TableColumn<>("Atualizado em");
        dateCol.setCellValueFactory(new PropertyValueFactory<>("updateDate"));
        dateCol.setPrefWidth(160);
        dateCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(LocalDate date, boolean empty) {
                super.updateItem(date, empty);
                setText(empty || date == null ? "" :
                        date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            }
        });

        TableColumn<BloodstockDTO, Integer> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(new PropertyValueFactory<>("quantity"));
        statusCol.setPrefWidth(140);
        statusCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(Integer value, boolean empty) {
                super.updateItem(value, empty);
                if (empty || value == null) {
                    setGraphic(null);
                    setText(null);
                } else {
                    Label chip = new Label();
                    if (value < 10) {
                        chip.setText("CRÍTICO");
                        chip.getStyleClass().addAll("status-chip", "status-critical");
                    } else if (value < 30) {
                        chip.setText("BAIXO");
                        chip.getStyleClass().addAll("status-chip", "status-warning");
                    } else {
                        chip.setText("BOM");
                        chip.getStyleClass().addAll("status-chip", "status-good");
                    }
                    setGraphic(chip);
                    setText(null);
                }
            }
        });

        tableView.getColumns().setAll(typeCol, qtyCol, dateCol, statusCol);
        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
    }

    /* ==================== RELATÓRIOS ==================== */
    private HBox createReportsSection() {
        HBox section = new HBox(14);
        section.setAlignment(Pos.CENTER_RIGHT);
        section.getStyleClass().add("report-section");

        Button stockBtn = new Button("Relatório de Estoque");
        stockBtn.getStyleClass().addAll("secondary-button", "report-button");
        stockBtn.setOnAction(e -> openStockReportPreview());

        Button historyBtn = new Button("Relatório de Histórico");
        historyBtn.getStyleClass().addAll("secondary-button", "report-button");
        historyBtn.setOnAction(e -> openHistoryReportPreview());

        section.getChildren().addAll(historyBtn, stockBtn);
        return section;
    }

    private void openStockReportPreview() {
        CompanyDTO company = companyComboBox.getValue();
        if (company == null) {
            showError("Selecione uma empresa para gerar o relatório de estoque!");
            return;
        }
        String html = buildStockReportHTML(company);
        openHTMLPreviewWindow("Relatório de Estoque", html);
    }

    private String buildStockReportHTML(CompanyDTO company) {
        StringBuilder html = new StringBuilder();
        html.append("""
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial; background: #f8f9fa; padding: 25px; }
                h1 { color: #b71c1c; text-align: center; margin-bottom: 6px; }
                h2 { color: #333; text-align: center; font-weight: 400; margin-top: 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: center; }
                th { background: #b71c1c; color: white; font-weight: 600; }
                tr:hover { background: #f1f1f1; }
                .status-critical { color: #e53935; font-weight: bold; }
                .status-warning { color: #f1a208; font-weight: bold; }
                .status-good { color: #2e7d32; font-weight: bold; }
                .summary { margin-top: 25px; font-size: 15px; color: #444; }
            </style>
        </head>
        <body>
    """);

        html.append("<h1>Relatório de Estoque</h1>");
        html.append("<h2>").append(company.getInstitutionName()).append("</h2>");
        html.append("<p style='text-align:center'>Gerado em: ")
                .append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                .append("</p>");

        html.append("<table><tr><th>Tipo</th><th>Quantidade</th><th>Status</th></tr>");

        int total = 0, critical = 0;
        for (BloodstockDTO s : controller.getBloodstockList()) {
            String statusClass, statusText;
            if (s.getQuantity() < 10) {
                statusClass = "status-critical";
                statusText = "Crítico";
                critical++;
            } else if (s.getQuantity() < 30) {
                statusClass = "status-warning";
                statusText = "Baixo";
            } else {
                statusClass = "status-good";
                statusText = "Bom";
            }
            html.append(String.format(
                    "<tr><td>%s</td><td>%d</td><td class='%s'>%s</td></tr>",
                    s.getBloodType(), s.getQuantity(), statusClass, statusText
            ));
            total += s.getQuantity();
        }
        html.append("</table>");
        html.append(String.format("<div class='summary'>Total de bolsas: <b>%d</b> | Tipos críticos: <b>%d</b></div>", total, critical));
        html.append("</body></html>");
        return html.toString();
    }

    private void openHistoryReportPreview() {
        CompanyDTO company = companyComboBox.getValue();
        if (company == null) {
            showError("Selecione uma empresa para gerar o relatório de histórico!");
            return;
        }
        controller.loadHistoryByCompany(
                company.getId(),
                list -> {
                    String html = buildHistoryReportHTML(company, list);
                    Platform.runLater(() -> openHTMLPreviewWindow("Relatório de Histórico", html));
                },
                this::showError
        );
    }

    private String buildHistoryReportHTML(CompanyDTO company, List<BloodstockMovement> hist) {
        StringBuilder html = new StringBuilder();
        html.append("""
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial; background: #f8f9fa; padding: 25px; }
                h1 { color: #1a237e; text-align: center; margin-bottom: 6px; }
                h2 { color: #333; text-align: center; font-weight: 400; margin-top: 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: center; font-size: 13px; }
                th { background: #1a237e; color: white; font-weight: 600; }
                tr:hover { background: #f1f1f1; }
                .empty { text-align: center; padding: 20px; color: #777; font-style: italic; }
            </style>
        </head>
        <body>
    """);

        html.append("<h1>Relatório de Histórico</h1>");
        html.append("<h2>").append(company.getInstitutionName()).append("</h2>");
        html.append("<p style='text-align:center'>Gerado em: ")
                .append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                .append("</p>");

        if (hist == null || hist.isEmpty()) {
            html.append("<div class='empty'>Nenhuma movimentação registrada.</div>");
        } else {
            html.append("<table><tr><th>Tipo</th><th>Movimentação</th><th>Antes</th><th>Depois</th><th>Usuário</th><th>Data</th></tr>");
            for (BloodstockMovement mv : hist) {
                html.append("<tr>")
                        .append("<td>").append(mv.getBloodstock() != null ? mv.getBloodstock().getBloodType() : "-").append("</td>")
                        .append("<td>").append(mv.getMovement()).append("</td>")
                        .append("<td>").append(mv.getQuantityBefore()).append("</td>")
                        .append("<td>").append(mv.getQuantityAfter()).append("</td>")
                        .append("<td>").append(mv.getActionBy() != null ? mv.getActionBy() : "-").append("</td>")
                        .append("<td>").append(mv.getActionDate() != null ?
                                mv.getActionDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "-")
                        .append("</td></tr>");
            }
            html.append("</table>");
        }

        html.append("</body></html>");
        return html.toString();
    }

    // ====================================================
    // Exportar WebView para PDF
    // ====================================================
    private void printToPdf(javafx.scene.web.WebView webView) {
        PrinterJob job = PrinterJob.createPrinterJob();
        if (job != null) {
            boolean proceed = job.showPrintDialog(webView.getScene().getWindow());
            if (proceed) {
                try {
                    webView.getEngine().print(job);
                    job.endJob();
                    showAlert("PDF gerado com sucesso!", Alert.AlertType.INFORMATION);
                } catch (Exception e) {
                    e.printStackTrace();
                    showAlert("Erro ao gerar PDF: " + e.getMessage(), Alert.AlertType.ERROR);
                }
            }
        }
    }

    private void showAlert(String message, Alert.AlertType type) {
        Alert alert = new Alert(type);
        alert.setTitle("Relatório");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    private void refreshAll(UUID companyId) {
        // Atualiza estoque
        loadStockForCompany(companyId);

        // Atualiza lista de lotes para saída
        try {
            controller.getApiService().getAvailableBatches(companyId);
            System.out.println("🔄 Lotes atualizados!");
        } catch (Exception e) {
            System.out.println("❌ Erro ao atualizar lotes: " + e.getMessage());
        }
    }








    /* ==================== PRÉ-VISUALIZAÇÃO HTML ==================== */
    private void openHTMLPreviewWindow(String title, String htmlContent) {
        Stage stage = new Stage();
        stage.initModality(Modality.APPLICATION_MODAL);
        stage.setTitle(title);
        stage.getIcons().add(new Image(getClass().getResourceAsStream("/icon.png")));


        javafx.scene.web.WebView webView = new javafx.scene.web.WebView();
        webView.getEngine().loadContent(htmlContent, "text/html");

        Button printBtn = new Button("🖨 Imprimir");
        printBtn.getStyleClass().add("secondary-button");
        printBtn.setOnAction(e -> printWebView(webView));

        Button pdfBtn = new Button("💾 Gerar PDF");
        pdfBtn.getStyleClass().add("secondary-button");
        pdfBtn.setOnAction(e -> printToPdf(webView));

        HBox actions = new HBox(10, pdfBtn, printBtn);
        actions.setAlignment(Pos.CENTER_RIGHT);
        actions.setPadding(new Insets(8, 15, 15, 15));

        VBox root = new VBox(webView, actions);
        root.setPadding(new Insets(10));

        Scene scene = new Scene(root, 900, 650);
        URL cssUrl = getClass().getResource("/style.css");
        if (cssUrl != null) scene.getStylesheets().add(cssUrl.toExternalForm());

        stage.setScene(scene);
        stage.show();
    }

    private void printWebView(javafx.scene.web.WebView webView) {
        PrinterJob job = PrinterJob.createPrinterJob();
        if (job != null && job.showPrintDialog(webView.getScene().getWindow())) {
            webView.getEngine().print(job);
            job.endJob();
        }
    }


    /* ==================== DADOS / LÓGICA ==================== */
    private void setupCompanyComboBox() {
        companyComboBox.setItems(controller.getCompanies());
        companyComboBox.setConverter(new StringConverter<>() {
            @Override public String toString(CompanyDTO c) { return c == null ? null : c.getInstitutionName(); }
            @Override public CompanyDTO fromString(String s) { return null; }
        });
        companyComboBox.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) {
                loadStockForCompany(newVal.getId());
            } else {
                clearBloodCards();
                if (tableView != null) tableView.getItems().clear();
            }
        });
    }

    private void loadCompanies() {
        controller.loadCompanies(this::showError);
    }

    private void loadStockForCompany(UUID id) {
        controller.loadBloodstockByCompany(id, error -> {
            System.out.println("❌ Erro ao carregar estoque: " + error);
            showError(error);
        }, () -> Platform.runLater(() -> {
            refreshBloodCards();
            tableView.refresh();
        }));
    }



    private void startAutoRefresh() {
        Timeline auto = new Timeline(new KeyFrame(Duration.seconds(20), e -> refreshBloodCards()));
        auto.setCycleCount(Animation.INDEFINITE);
        auto.play();
    }

    private void refreshBloodCards() {
        if (controller.getBloodstockList().isEmpty()) return;
        for (BloodstockDTO s : controller.getBloodstockList()) updateBloodCard(s.getBloodType(), s.getQuantity());
        // atualiza tabela automaticamente (lista é observável)
    }

    private void clearBloodCards() {
        bloodLabels.values().forEach(l -> l.setText("0 bolsas"));
        bloodBars.values().forEach(b -> b.setProgress(0));
        bloodCards.values().forEach(c -> {
            Label status = (Label) c.getChildren().get(3);
            status.setText("Sem dados");
            status.setStyle("-fx-text-fill: #607d8b;");
        });
    }

    private void updateBloodCard(String type, int quantity) {
        Platform.runLater(() -> {
            Label label = bloodLabels.get(type);
            ProgressBar bar = bloodBars.get(type);
            VBox card = bloodCards.get(type);
            if (label == null || bar == null || card == null) return;

            double target = Math.min(Math.max(quantity / 100.0, 0), 1);
            Timeline tl = new Timeline(
                    new KeyFrame(Duration.ZERO, new KeyValue(bar.progressProperty(), bar.getProgress())),
                    new KeyFrame(Duration.millis(600), new KeyValue(bar.progressProperty(), target, Interpolator.EASE_BOTH))
            );
            tl.play();

            label.setText(quantity + " bolsas");

            Label status = (Label) card.getChildren().get(3);
            if (quantity < 10) {
                status.setText("Crítico");
                bar.getStyleClass().setAll("blood-bar", "critical-bar");
                status.setStyle("-fx-text-fill: #e53935;");
                card.setStyle("-fx-border-color: #e53935; -fx-border-width: 0 0 0 4;");
            } else if (quantity < 30) {
                status.setText("Baixo");
                bar.getStyleClass().setAll("blood-bar", "warning-bar");
                status.setStyle("-fx-text-fill: #f1a208;");
                card.setStyle("-fx-border-color: #f1a208; -fx-border-width: 0 0 0 4;");
            } else {
                status.setText("Bom");
                bar.getStyleClass().setAll("blood-bar", "good-bar");
                status.setStyle("-fx-text-fill: #2e7d32;");
                card.setStyle("-fx-border-color: #2e7d32; -fx-border-width: 0 0 0 4;");
            }
        });
    }

    private void processMovement() {
        CompanyDTO company = companyComboBox.getValue();
        String type = bloodComboBox.getValue();
        String qtyText = quantityField.getText();

        if (company == null || type == null || qtyText == null || qtyText.isBlank() || selectedMovementType == null) {
            showError("Preencha todos os campos e selecione o tipo de movimentação!");
            return;
        }

        try {
            int qty = Integer.parseInt(qtyText.trim());

            controller.processMovement(
                    selectedMovementType,
                    company.getId(),
                    type,
                    qty,
                    msg -> {
                        showSuccess(msg);
                        refreshAll(company.getId());  //🚀 Agora os cards e lotes recarregam!
                    },
                    this::showError
            );

            quantityField.clear();

        } catch (NumberFormatException e) {
            showError("Quantidade inválida!");
        }
    }


    private void showError(String msg) {
        Platform.runLater(() -> {
            if (statusLabel == null) return;
            statusLabel.setText("❌ " + msg);
            statusLabel.getStyleClass().setAll("status-label", "error-status");
            statusLabel.setVisible(true);
        });
    }

    private void showSuccess(String msg) {
        Platform.runLater(() -> {
            if (statusLabel == null) return;
            statusLabel.setText("✅ " + msg);
            statusLabel.getStyleClass().setAll("status-label", "success-status");
            statusLabel.setVisible(true);
        });
    }

    public static void main(String[] args) {
        launch(args);
    }
}
