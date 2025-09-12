package com.example.blood_stock_service.service;

import com.example.blood_stock_service.model.Bloodstock;
import com.example.blood_stock_service.repository.StockRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class BloodstockService {

	private final StockRepository stockRepository;

	public BloodstockService(StockRepository stockRepository) {
		this.stockRepository = stockRepository;
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
	public Bloodstock salvar(Bloodstock bloodstock) {
		return stockRepository.save(bloodstock);
	}

}
