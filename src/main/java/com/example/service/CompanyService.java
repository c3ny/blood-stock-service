package com.example.service;

import com.example.entity.Company;
import com.example.model.CompanyDTO;
import com.example.model.Bloodstock;
import com.example.mapper.CompanyMapper;
import com.example.respository.CompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final BloodstockService bloodstockService; // relação com a outra service
    private final CompanyMapper mapper = CompanyMapper.INSTANCE;

    public CompanyService(CompanyRepository companyRepository, BloodstockService bloodstockService) {
        this.companyRepository = companyRepository;
        this.bloodstockService = bloodstockService;
    }

    @Transactional(readOnly = true)
    public List<CompanyDTO> listAll() {
        return companyRepository.findAll()
                .stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CompanyDTO findById(UUID id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        return mapper.toDTO(company);
    }

    public boolean existsById(UUID companyId) {
        return companyRepository.existsById(companyId);
    }

    @Transactional
    public Company createCompanyWithBloodstock(Company company, Bloodstock stock) {
        // Salva a empresa
        Company savedCompany = companyRepository.save(company);

        // Associa o Bloodstock à empresa (mesma transação)
        bloodstockService.save(stock, savedCompany.getId());

        return savedCompany;
    }

    @Transactional
    public Company createCompany(Company company) {
        return companyRepository.save(company);
    }
}
