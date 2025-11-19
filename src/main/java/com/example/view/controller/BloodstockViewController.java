package com.example.view.controller;

import com.example.model.Bloodstock;
import com.example.model.BloodstockMovement;
import com.example.model.CompanyDTO;
import com.example.view.service.BloodstockApiService;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.control.Alert;

import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;

/**
 * Controller JavaFX seguindo o padrão MVC.
 * Gerencia a lógica de negócio e comunicação entre View e Service.
 */
public class BloodstockViewController {

    private final BloodstockApiService apiService;
    private final ObservableList<CompanyDTO> companies;
    private final ObservableList<Bloodstock> bloodstockList;

    public BloodstockViewController() {
        this.apiService = new BloodstockApiService();
        this.companies = FXCollections.observableArrayList();
        this.bloodstockList = FXCollections.observableArrayList();
    }

    // ==================== Getters para ObservableLists ====================

    public ObservableList<CompanyDTO> getCompanies() {
        return companies;
    }

    public ObservableList<Bloodstock> getBloodstockList() {
        return bloodstockList;
    }

    // ==================== Métodos de negócio ====================

    /**
     * Carrega todas as empresas de forma assíncrona.
     */
    public void loadCompanies(Consumer<String> onError) {
        apiService.fetchCompanies()
                .thenAccept(companyList -> {
                    Platform.runLater(() -> {
                        companies.clear();
                        companies.addAll(companyList);
                    });
                })
                .exceptionally(e -> {
                    Platform.runLater(() -> onError.accept("Erro ao carregar empresas: " + e.getMessage()));
                    return null;
                });
    }

    /**
     * Carrega o estoque de uma empresa específica de forma assíncrona.
     */
    public void loadBloodstockByCompany(UUID companyId, Consumer<String> onError) {
        apiService.fetchBloodstockByCompany(companyId)
                .thenAccept(stocks -> {
                    Platform.runLater(() -> {
                        bloodstockList.clear();
                        bloodstockList.addAll(stocks);
                    });
                })
                .exceptionally(e -> {
                    Platform.runLater(() -> onError.accept("Erro ao carregar estoque: " + e.getMessage()));
                    return null;
                });
    }

    /**
     * Busca o histórico de movimentações de uma empresa.
     */
    public void loadHistoryByCompany(UUID companyId, Consumer<List<BloodstockMovement>> onSuccess, Consumer<String> onError) {
        apiService.fetchHistoryByCompany(companyId)
                .thenAccept(history -> {
                    Platform.runLater(() -> onSuccess.accept(history));
                })
                .exceptionally(e -> {
                    Platform.runLater(() -> onError.accept("Erro ao carregar histórico: " + e.getMessage()));
                    return null;
                });
    }

    /**
     * Cria ou atualiza um item de estoque.
     */
    public void saveBloodstock(Bloodstock bloodstock, UUID companyId,
                               Consumer<Bloodstock> onSuccess, Consumer<String> onError) {
        apiService.saveBloodstock(bloodstock, companyId)
                .thenAccept(savedBloodstock -> {
                    Platform.runLater(() -> {
                        if (savedBloodstock != null) {
                            onSuccess.accept(savedBloodstock);
                            // Recarregar a lista
                            loadBloodstockByCompany(companyId, onError);
                        } else {
                            onError.accept("Erro ao salvar estoque");
                        }
                    });
                })
                .exceptionally(e -> {
                    Platform.runLater(() -> onError.accept("Erro ao salvar: " + e.getMessage()));
                    return null;
                });
    }

    /**
     * Atualiza a quantidade de um item de estoque.
     */
    public void updateQuantity(UUID bloodstockId, int quantity, UUID companyId,
                               Consumer<Bloodstock> onSuccess, Consumer<String> onError) {
        apiService.updateQuantity(bloodstockId, quantity)
                .thenAccept(updatedBloodstock -> {
                    Platform.runLater(() -> {
                        if (updatedBloodstock != null) {
                            onSuccess.accept(updatedBloodstock);
                            // Recarregar a lista
                            loadBloodstockByCompany(companyId, onError);
                        } else {
                            onError.accept("Erro ao atualizar quantidade");
                        }
                    });
                })
                .exceptionally(e -> {
                    Platform.runLater(() -> onError.accept("Erro ao atualizar: " + e.getMessage()));
                    return null;
                });
    }

    /**
     * Processa uma movimentação de estoque (entrada ou saída).
     */
    public void processMovement(String movementType, UUID companyId, String bloodType,
                                int quantity, Consumer<String> onSuccess, Consumer<String> onError) {

        // Validações
        if (movementType == null || movementType.isEmpty()) {
            onError.accept("Selecione o tipo de movimentação (Entrada ou Saída)");
            return;
        }

        if (bloodType == null || bloodType.isEmpty()) {
            onError.accept("Selecione o tipo sanguíneo");
            return;
        }

        if (quantity <= 0) {
            onError.accept("A quantidade deve ser maior que zero");
            return;
        }

        // Ajustar quantidade para saída (negativo)
        int adjustedQuantity = movementType.equals("Saída") ? -quantity : quantity;

        // Buscar o bloodstock existente para esse tipo sanguíneo
        Bloodstock existingBloodstock = bloodstockList.stream()
                .filter(b -> b.getBloodType().equals(bloodType))
                .findFirst()
                .orElse(null);

        if (existingBloodstock != null) {
            // Atualizar quantidade existente
            updateQuantity(existingBloodstock.getId(), adjustedQuantity, companyId,
                    updated -> onSuccess.accept("Movimentação realizada com sucesso!"),
                    onError);
        } else {
            // Criar novo bloodstock
            Bloodstock newBloodstock = new Bloodstock();
            newBloodstock.setBloodType(bloodType);
            newBloodstock.setQuantity(adjustedQuantity);

            saveBloodstock(newBloodstock, companyId,
                    saved -> onSuccess.accept("Estoque criado com sucesso!"),
                    onError);
        }
    }

    /**
     * Exibe um alerta de erro.
     */
    public static void showAlert(String message) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle("Erro");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    /**
     * Exibe um alerta de sucesso.
     */
    public BloodstockApiService getApiService() {
        return apiService;
    }

    /**
     * Exibe um alerta de sucesso.
     */
    public static void showSuccess(String message) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle("Sucesso");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
