package com.example.model;

import jakarta.persistence.*;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonProperty;


@Entity
@Table(name = "stock")
public class Bloodstock {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "blood_type")
    @JsonProperty("blood_type")
    private String bloodType;

    private int quantity;

    @ManyToOne
    @JoinColumn(name = "fk_company_id", nullable = false)
    private Company company;

    // Getters e Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getBloodType() { return bloodType; }
    public void setBloodType(String bloodType) { this.bloodType = bloodType; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
}