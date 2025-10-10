package com.example.respository;

import com.example.model.BloodstockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BloodstockMovementRepository extends JpaRepository<BloodstockMovement, UUID> {
    List<BloodstockMovement> findAllByBloodstock_IdOrderByUpdateDateDesc(UUID bloodstockId);
}

