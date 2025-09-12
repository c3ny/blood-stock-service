package com.example.blood_stock_service.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Table;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;


@Entity
@Table(name = "stock")

public class Bloodstock {

    @Id
    @GeneratedValue
    private UUID id;

    @JsonProperty("blood_type")
    private String blood_type;
    private int quantidade;

    @ManyToOne
    @JoinColumn(name = "fk_company_id", nullable = false)
    private Company company;

    // Getters e Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }
    @JsonProperty("blood_type")
    public String getBloodType() {
        return blood_type;
    }
    @JsonProperty("blood_type")
    public void setBloodType(String blood_type) {
        this.blood_type = blood_type;
    }

    public int getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(int quantidade) {
        this.quantidade = quantidade;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }
}
