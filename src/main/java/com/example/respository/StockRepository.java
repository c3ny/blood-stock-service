package com.example.blood_stock_service.repository;

import com.example.blood_stock_service.model.Bloodstock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;


@Repository
public interface StockRepository extends JpaRepository<Bloodstock, UUID> {
}
