package com.example.service;

import com.example.model.Bloodstock;
import com.example.model.Company;
import com.example.respository.StockRepository;
import com.example.respository.CompanyRepository;
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

	public List<Bloodstock> listAll() {
		return stockRepository.findAll();
	}

	public Bloodstock updateQuantity(UUID id, int quantity) {
		Bloodstock stock = stockRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Stock not found"));
		stock.setQuantity(quantity);
		return stockRepository.save(stock);
	}

	public Bloodstock save(Bloodstock bloodstock, UUID companyId) {
		Company company = companyRepository.findById(companyId)
				.orElseThrow(() -> new RuntimeException("Company not found"));

		bloodstock.setCompany(company);
		return stockRepository.save(bloodstock);
	}

    public Bloodstock save(UUID companyId, Bloodstock bloodStock) {
        // Busca a company pelo ID
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        // Associa a company ao estoque de sangue
        bloodStock.setCompany(company);

        // Salva no banco
        return stockRepository.save(bloodStock);
    }



	public Bloodstock save(Bloodstock bloodstock) {
		return stockRepository.save(bloodstock);
	}

}
