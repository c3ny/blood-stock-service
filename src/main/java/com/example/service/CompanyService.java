package com.example.service;

import com.example.entity.Company;
import com.example.model.CompanyDTO;
import com.example.respository.CompanyRepository;
import com.example.mapper.CompanyMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyMapper mapper = CompanyMapper.INSTANCE;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    /**
     * Lista todas as empresas (apenas leitura, sem abrir transação completa).
     */
    @Transactional(readOnly = true)
    public List<CompanyDTO> listAll() {
        return companyRepository.findAll()
                .stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Busca uma empresa por ID (apenas leitura).
     */
    @Transactional(readOnly = true)
    public CompanyDTO findById(UUID id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        return mapper.toDTO(company);
    }

    /**
     * Verifica se a empresa existe (leitura apenas).
     */
    @Transactional(readOnly = true)
    public boolean existsById(UUID companyId) {
        return companyRepository.existsById(companyId);
    }

    /**
     * Cria uma nova empresa (abre transação).
     */
    @Transactional
    public Company createCompany(Company company) {
        return companyRepository.save(company);
    }

    /**
     * Atualiza dados da empresa (também dentro de transação).
     */
    @Transactional
    public Company updateCompany(UUID id, Company updatedData) {
        Company existing = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        existing.setName(updatedData.getName());
        existing.setCnpj(updatedData.getCnpj());
        existing.setAddress(updatedData.getAddress());

        return companyRepository.save(existing);
    }
}

