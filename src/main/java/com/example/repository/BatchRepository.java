package com.example.repository;

import com.example.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BatchRepository extends JpaRepository<Batch, UUID> {

    // Buscar lote pelo código E empresa
    Optional<Batch> findByBatchCodeAndCompany_Id(String batchCode, UUID companyId);

    // Buscar todos os lotes de uma empresa
    List<Batch> findByCompany_Id(UUID companyId);

    // Buscar apenas lotes que ainda têm sangue disponível
    @Query("SELECT DISTINCT b FROM Batch b LEFT JOIN FETCH b.bloodDetails WHERE b.company.id = :companyId")
    List<Batch> findAvailableBatches(UUID companyId);
}
