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
    private final CompanyMapper mapper;

    public CompanyService(CompanyRepository companyRepository, CompanyMapper mapper) {
        this.companyRepository = companyRepository;
        this.mapper = mapper;
    }

    public List<CompanyDTO> listAll() {
        return companyRepository.findAll()
                .stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public CompanyDTO findById(UUID id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        return mapper.toDTO(company);
    }

    public boolean existsById(UUID companyId) {
        return companyRepository.existsById(companyId);
    }
}
