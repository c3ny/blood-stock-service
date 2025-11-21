package com.example.repository;

import com.example.entity.BloodstockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BloodstockMovementRepository extends JpaRepository<BloodstockMovement, UUID> {
    List<BloodstockMovement> findAllByBloodstock_IdOrderByUpdateDateDesc(UUID bloodstockId);
    List<BloodstockMovement> findByBloodstock_Company_IdOrderByActionDateDesc(UUID companyId);
}

