package com.example.blood_stock_service.repository;

import com.example.blood_stock_service.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CompanyRepository extends JpaRepository<Company, UUID> {
}