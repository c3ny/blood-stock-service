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

    public Bloodstock save(Bloodstock stock, UUID companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new NoSuchElementException("Empresa não encontrada"));
        stock.setCompany(company);
        return stockRepository.save(stock);
    }

    public List<Bloodstock> listAll() {
        return stockRepository.findAll();
    }

    public List<Bloodstock> findByCompany(UUID companyId) {
        return stockRepository.findAllByCompanyId(companyId);
    }

    public Bloodstock updateQuantity(UUID id, int movement) {
        Bloodstock stock = stockRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Estoque não encontrado"));

        int current = stock.getQuantity();
        int updated = current + movement;

        if (updated < 0)
            throw new InsufficientStockException("Estoque insuficiente");

        stock.setQuantity(updated);
        stockRepository.save(stock);

        BloodstockMovement history = new BloodstockMovement();
        history.setBloodstock(stock);
        history.setQuantityBefore(current);
        history.setQuantityAfter(updated);
        history.setMovement(movement);
        history.setActionDate(LocalDateTime.now());
        history.setActionBy("system");
        history.setNotes("Ajuste manual");
        historyRepository.save(history);

        return stock;
    }

    @Transactional
    public Batch processBatchEntry(UUID companyId, BatchEntryRequestDTO requestDTO) {

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new NoSuchElementException("Empresa não encontrada"));

        Batch batch = batchRepository.findByBatchCodeAndCompany_Id(requestDTO.getBatchCode(), companyId)
                .orElse(null);

        if (batch == null) {
            batch = new Batch();
            batch.setCompany(company);
            batch.setBatchCode(requestDTO.getBatchCode());
            batch.setEntryDate(LocalDate.now());
        }

        batch = batchRepository.save(batch);

        // ----- 🔥 Substituição do lambda por loop foreach -----
        for (Map.Entry<String, Integer> entry : requestDTO.getBloodQuantities().entrySet()) {

            String bloodType = entry.getKey();
            int qty = entry.getValue();

            if (qty <= 0) continue;

            BloodType type = BloodType.valueOf(bloodType);

            // Atualiza ou cria entrada no lote
            BatchBlood existing = null;
            for (BatchBlood b : batch.getBloodDetails()) {
                if (b.getBloodType().equals(type)) {
                    existing = b;
                    break;
                }
            }

            if (existing != null) {
                existing.setQuantity(existing.getQuantity() + qty);
            } else {
                batch.addBloodDetail(new BatchBlood(batch, type, qty));
            }

            // Atualiza ou cria estoque
            Bloodstock stock = stockRepository.findByCompanyIdAndBloodType(companyId, type)
                    .orElse(null);

            if (stock == null) {
                stock = new Bloodstock();
                stock.setCompany(company);
                stock.setBloodType(type);
                stock.setQuantity(0);
            }

            int oldQty = stock.getQuantity();
            int newQty = oldQty + qty;

            stock.setQuantity(newQty);
            stockRepository.save(stock);

            // Registrar histórico
            BloodstockMovement history = new BloodstockMovement();
            history.setBloodstock(stock);
            history.setMovement(qty);
            history.setQuantityBefore(oldQty);
            history.setQuantityAfter(newQty);
            history.setActionBy("system");
            history.setNotes("Entrada em lote: " + requestDTO.getBatchCode());
            history.setActionDate(LocalDateTime.now());
            historyRepository.save(history);
        }

        return batchRepository.save(batch);
    }




    @Transactional
    public Batch processBulkBatchExit(UUID companyId, BatchExitBulkRequestDTO dto) {

        Batch batch = batchRepository.findById(dto.getBatchId())
                .orElseThrow(() -> new NoSuchElementException("Lote não encontrado"));

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new NoSuchElementException("Empresa não encontrada"));

        dto.getQuantities().forEach((bloodType, qtyToRemove) -> {

            final BloodType type = BloodType.valueOf(bloodType);
            final int qty = qtyToRemove;

            if (qty <= 0) return;

            BatchBlood entry = batch.getBloodDetails().stream()
                    .filter(b -> b.getBloodType().equals(type))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Tipo sanguíneo inexistente no lote"));

            if (entry.getQuantity() < qty)
                throw new IllegalStateException("Quantidade insuficiente no lote");

            entry.setQuantity(entry.getQuantity() - qty);

            Bloodstock stock = stockRepository.findByCompanyIdAndBloodType(companyId, type)
                    .orElseGet(() -> {
                        Bloodstock newStock = new Bloodstock();
                        newStock.setCompany(company);
                        newStock.setBloodType(type);
                        newStock.setQuantity(0);
                        return newStock;
                    });

            int oldStockQty = stock.getQuantity();
            int newStockQty = oldStockQty - qty;

            if (newStockQty < 0)
                throw new IllegalStateException("Resultado inválido: estoque negativo");

            stock.setQuantity(newStockQty);
            stockRepository.save(stock);

            BloodstockMovement history = new BloodstockMovement();
            history.setBloodstock(stock);
            history.setMovement(qty * -1);
            history.setQuantityBefore(oldStockQty);
            history.setQuantityAfter(newStockQty);
            history.setActionBy("system");
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
