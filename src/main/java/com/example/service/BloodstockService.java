package com.example.service;

import com.example.dto.request.BatchEntryRequestDTO;
import com.example.dto.request.BatchExitBulkRequestDTO;
import com.example.entity.*;
import com.example.exception.InsufficientStockException;
import com.example.repository.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.*;

@Service
public class BloodstockService {

    private final StockRepository stockRepository;
    private final CompanyRepository companyRepository;
    private final BloodstockMovementRepository historyRepository;
    private final BatchRepository batchRepository;

    public BloodstockService(
            StockRepository stockRepository,
            CompanyRepository companyRepository,
            BloodstockMovementRepository historyRepository,
            BatchRepository batchRepository
    ) {
        this.stockRepository = stockRepository;
        this.companyRepository = companyRepository;
        this.historyRepository = historyRepository;
        this.batchRepository = batchRepository;
    }

    public Bloodstock save(Bloodstock stock) {
        return stockRepository.save(stock);
    }

    public Bloodstock save(Bloodstock stock, UUID companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada"));
        stock.setCompany(company);
        return stockRepository.save(stock);
    }

    public List<Bloodstock> listAll() {
        return stockRepository.findAll();
    }

    public List<Bloodstock> findByCompany(UUID companyId) {
        return stockRepository.findAllByCompanyId(companyId);
    }

    public Bloodstock updateQuantity(UUID id, int movement, String user) {
        Bloodstock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estoque não encontrado"));

        int current = stock.getQuantity();
        int updated = current + movement;

        if (updated < 0)
            throw new InsufficientStockException("Estoque insuficiente");

        stock.setQuantity(updated);
        stockRepository.save(stock);

        BloodstockMovement movementRecord = new BloodstockMovement();
        movementRecord.setBloodstock(stock);
        movementRecord.setQuantityBefore(current);
        movementRecord.setQuantityAfter(updated);
        movementRecord.setMovement(movement);
        movementRecord.setActionDate(LocalDateTime.now());
        movementRecord.setActionBy(user);
        movementRecord.setNotes("Ajuste manual");

        historyRepository.save(movementRecord);

        return stock;
    }


    // -----------------------
    // BATCH ENTRY (NOVO)
    // -----------------------
    @Transactional
    public Batch processBatchEntry(UUID companyId, BatchEntryRequestDTO requestDTO) {

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        Batch temp = batchRepository.findByBatchCodeAndCompany_Id(requestDTO.getBatchCode(), companyId)

                .orElseGet(() -> {
                    Batch newBatch = new Batch();
                    newBatch.setCompany(company);
                    newBatch.setBatchCode(requestDTO.getBatchCode());
                    newBatch.setEntryDate(LocalDate.now());
                    return newBatch;
                });

        // 💾 garante que o batch existe no banco antes de adicionar itens
        final Batch batch = batchRepository.save(temp);


        requestDTO.getBloodQuantities().forEach((bloodType, quantity) -> {
            if (quantity > 0) {

                batch.getBloodDetails().stream()
                        .filter(d -> d.getBloodType().equals(bloodType))
                        .findFirst()
                        .ifPresentOrElse(
                                d -> d.setQuantity(d.getQuantity() + quantity),
                                () -> batch.addBloodDetail(new BatchBlood(batch, bloodType, quantity))
                        );

                // Atualiza estoque
                Bloodstock stock = stockRepository.findByCompanyIdAndBloodType(companyId, bloodType)
                        .orElseGet(() -> {
                            Bloodstock newStock = new Bloodstock();
                            newStock.setCompany(company);
                            newStock.setBloodType(bloodType);
                            newStock.setQuantity(0);
                            return newStock;
                        });

                int oldQty = stock.getQuantity();
                int newQty = oldQty + quantity;

                stock.setQuantity(newQty);
                stockRepository.save(stock);

                BloodstockMovement history = new BloodstockMovement();
                history.setBloodstock(stock);
                history.setMovement(quantity);
                history.setQuantityBefore(oldQty);
                history.setQuantityAfter(newQty);
                history.setActionBy("admin");
                history.setNotes("Entrada em lote: " + requestDTO.getBatchCode());
                history.setActionDate(LocalDateTime.now());
                historyRepository.save(history);
            }
        });

        return batchRepository.save(batch);
    }



    // -----------------------
    // BULK EXIT
    // -----------------------
    @Transactional
    public Batch processBulkBatchExit(UUID companyId, BatchExitBulkRequestDTO dto) {

        Batch batch = batchRepository.findById(dto.getBatchId())
                .orElseThrow(() -> new RuntimeException("Lote não encontrado"));

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Empresa não encontrada"));

        dto.getQuantities().forEach((bloodType, qtyToRemove) -> {

            if (qtyToRemove <= 0) return;

            // 1 - Atualiza o lote
            BatchBlood entry = batch.getBloodDetails().stream()
                    .filter(b -> b.getBloodType().equals(bloodType))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Tipo sanguíneo inexistente no lote"));

            if (entry.getQuantity() < qtyToRemove)
                throw new RuntimeException("Quantidade insuficiente no lote (" + bloodType + ")");

            int oldBatchQty = entry.getQuantity();
            entry.setQuantity(oldBatchQty - qtyToRemove);

            // 2 - Atualiza o estoque geral
            Bloodstock stock = stockRepository.findByCompanyIdAndBloodType(companyId, bloodType)
                    .orElseGet(() -> {
                        Bloodstock newStock = new Bloodstock();
                        newStock.setCompany(company);
                        newStock.setBloodType(bloodType);
                        newStock.setQuantity(0);
                        return newStock;
                    });

            int oldStockQty = stock.getQuantity();
            int newStockQty = oldStockQty - qtyToRemove;

            if (newStockQty < 0)
                throw new RuntimeException("Estoque geral negativo — ajuste inválido!");

            stock.setQuantity(newStockQty);
            stockRepository.save(stock);

            // 3 - Registrar histórico do movimento
            BloodstockMovement history = new BloodstockMovement();
            history.setBloodstock(stock);
            history.setMovement(qtyToRemove * -1);
            history.setQuantityBefore(oldStockQty);
            history.setQuantityAfter(newStockQty);
            history.setActionBy("admin");
            history.setNotes("Saída por lote: " + batch.getBatchCode());
            history.setActionDate(LocalDateTime.now());

            historyRepository.save(history);
        });

        return batchRepository.save(batch);
    }




    public List<Batch> getAvailableBatches(UUID companyId) {
        return batchRepository.findAvailableBatches(companyId);
    }

}


