package com.example.respository;

import com.example.model.BloodstockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BloodstockMovementRepository extends JpaRepository<BloodstockMovement, UUID> {}
