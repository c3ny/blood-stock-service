package com.example.service;

import com.example.exception.InsufficientStockException;
import com.example.model.Bloodstock;
import com.example.entity.Company;
import com.example.model.BloodstockMovement;
import com.example.respository.BloodstockMovementRepository;
import com.example.respository.StockRepository;
import com.example.respository.CompanyRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BloodstockService {

    private final StockRepository stockRepository;
    private final CompanyRepository companyRepository;
    private final BloodstockMovementRepository historyRepository;

    public BloodstockService(
            StockRepository stockRepository,
            CompanyRepository companyRepository,
            BloodstockMovementRepository historyRepository) {
        this.stockRepository = stockRepository;
        this.companyRepository = companyRepository;
        this.historyRepository = historyRepository;
    }


    public List<Bloodstock> listAll() {
        return stockRepository.findAll();
    }

    public List<BloodstockMovement> findByCompanyId(UUID companyId) {
        return historyRepository.findByBloodstock_Company_IdOrderByActionDateDesc(companyId);
    }



    @Transactional
    public Bloodstock updateQuantity(UUID id, int movement, String currentUser) {
        // 1. Buscar o estoque
        Bloodstock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock not found"));

        int currentQuantity = stock.getQuantity();
        int newQuantity = currentQuantity + movement;

        if (newQuantity < 0) {
            throw new InsufficientStockException("Não há estoque suficiente!");
        }

        // 2. Atualizar estoque
        stock.setQuantity(newQuantity);
        stockRepository.save(stock);

        // 3. Salvar histórico
        BloodstockMovement history = new BloodstockMovement();
        history.setBloodstock(stock);
        history.setMovement(movement);
        history.setQuantityBefore(currentQuantity);
        history.setQuantityAfter(newQuantity);
        history.setActionBy(currentUser);
        history.setActionDate(LocalDateTime.now());
        historyRepository.save(history);

        // 4. Retornar estoque atualizado
        return stock;
    }



    public Bloodstock save(Bloodstock bloodstock, UUID companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        bloodstock.setCompany(company);
        return stockRepository.save(bloodstock);
    }

    // Método para buscar estoque pelo ID da empresa
    public List<Bloodstock> findByCompany(UUID companyId) {
        return stockRepository.findAllByCompanyId(companyId);
    }

    public Bloodstock save(Bloodstock bloodstock) {
        return stockRepository.save(bloodstock);
    }
}



