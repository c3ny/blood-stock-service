package com.example.blood_stock_service.service;

import com.example.blood_stock_service.model.Bloodstock;
import com.example.blood_stock_service.model.Company;
import com.example.blood_stock_service.repository.StockRepository;
import com.example.blood_stock_service.repository.CompanyRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class BloodstockService {

	private final StockRepository stockRepository;
	private final CompanyRepository companyRepository;

	public BloodstockService(StockRepository stockRepository, CompanyRepository companyRepository) {
		this.stockRepository = stockRepository;
		this.companyRepository = companyRepository;
	}

	public List<Bloodstock> listarTodos() {
		return stockRepository.findAll();
	}

	public Bloodstock atualizarQuantidade(UUID id, int quantidade) {
		Bloodstock estoque = stockRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Estoque não encontrado"));
		estoque.setQuantidade(quantidade);
		return stockRepository.save(estoque);
	}

	public Bloodstock salvar(Bloodstock bloodstock, UUID companyId) {
		Company company = companyRepository.findById(companyId)
				.orElseThrow(() -> new RuntimeException("Empresa não encontrada"));
		bloodstock.setCompany(company);
		return stockRepository.save(bloodstock);
	}

	public Bloodstock salvar(Bloodstock bloodstock) {
		return stockRepository.save(bloodstock);
	}

}
