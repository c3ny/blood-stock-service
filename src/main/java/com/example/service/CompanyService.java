package com.example.service;

import com.example.entity.Company;
import com.example.model.CompanyDTO;
import com.example.respository.CompanyRepository;
import com.example.mapper.CompanyMapper;
import org.springframework.stereotype.Service;

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

    // Lista todas as empresas como DTO
    public List<CompanyDTO> listAll() {
        return companyRepository.findAll()
                .stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    // Busca empresa por id como DTO
    public CompanyDTO findById(UUID id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        return mapper.toDTO(company);
    }
}
