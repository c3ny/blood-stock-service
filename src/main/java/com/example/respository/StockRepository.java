package com.example.respository;

import com.example.model.Bloodstock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;


@Repository
public interface StockRepository extends JpaRepository<Bloodstock, UUID> {
    List<Bloodstock> findAllByCompanyId(UUID companyId);

}
