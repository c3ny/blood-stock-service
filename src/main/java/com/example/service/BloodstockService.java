package com.example.service;

import com.example.exception.InsufficientStockException;
import com.example.model.Bloodstock;
import com.example.entity.Company;
import com.example.model.BloodstockMovement;
import com.example.respository.BloodstockMovementRepository;
import com.example.respository.StockRepository;
import com.example.respository.CompanyRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
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

    /**
     * Lista todo o estoque (apenas leitura).
     */
    @Transactional(readOnly = true)
    public List<Bloodstock> listAll() {
        return stockRepository.findAll();
    }

    /**
     * Busca histórico de movimentações de estoque por empresa (apenas leitura).
     */
    @Transactional(readOnly = true)
    public List<BloodstockMovement> findByCompanyId(UUID companyId) {
        return historyRepository.findByBloodstock_Company_IdOrderByActionDateDesc(companyId);
    }

    /**
     * Atualiza a quantidade de sangue em estoque.
     * Usa REQUIRED pois a operação deve ser atômica (atualização + histórico).
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public Bloodstock updateQuantity(UUID id, int movement, String currentUser) {
        Bloodstock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock not found"));

        int currentQuantity = stock.getQuantity();
        int newQuantity = currentQuantity + movement;

        if (newQuantity < 0) {
            throw new InsufficientStockException("Não há estoque suficiente!");
        }

        stock.setQuantity(newQuantity);
        stockRepository.save(stock);

        BloodstockMovement history = new BloodstockMovement();
        history.setBloodstock(stock);
        history.setMovement(movement);
        history.setQuantityBefore(currentQuantity);
        history.setQuantityAfter(newQuantity);
        history.setActionBy(currentUser);
        history.setActionDate(LocalDateTime.now());
        historyRepository.save(history);

        return stock;
    }

    /**
     * Salva um novo estoque de sangue vinculado a uma empresa.
     * Só pode ser chamado dentro de uma transação existente.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public Bloodstock save(Bloodstock bloodstock, UUID companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        bloodstock.setCompany(company);
        return stockRepository.save(bloodstock);
    }

    /**
     * Busca estoque pelo ID da empresa (leitura apenas).
     */
    @Transactional(readOnly = true)
    public List<Bloodstock> findByCompany(UUID companyId) {
        return stockRepository.findAllByCompanyId(companyId);
    }

    /**
     * Salva o estoque, obrigando a estar dentro de uma transação já ativa.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public Bloodstock save(Bloodstock bloodstock) {
        return stockRepository.save(bloodstock);
    }
}




