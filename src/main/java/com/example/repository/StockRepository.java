package com.example.repository;

import com.example.entity.Bloodstock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import com.example.entity.BloodType;


@Repository
public interface StockRepository extends JpaRepository<Bloodstock, UUID> {
    List<Bloodstock> findAllByCompanyId(UUID companyId);
    Optional<Bloodstock> findByCompanyIdAndBloodType(UUID companyId, BloodType bloodType);

}
