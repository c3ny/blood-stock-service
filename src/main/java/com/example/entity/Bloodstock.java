package com.example.entity;

import com.example.dto.response.BloodstockDTO;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
import com.example.entity.BloodType;



@NamedQuery(
        name = "Bloodstock.findAllByCompanyId",
        query = "SELECT b FROM Bloodstock b WHERE b.company.id = :companyId"
)
@Entity
@Table(name = "stock")
public class Bloodstock {

    @Id
    @GeneratedValue(generator = "UUID")
    @org.hibernate.annotations.GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(updatable = false, nullable = false)
    private UUID id;

    @NotNull(message = "Tipo sanguíneo é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(name = "blood_type")
    @JsonProperty("blood_type")
    private BloodType bloodType;


    @Column(name = "update_date")
    @JsonProperty("update_date")
    private LocalDate updateDate;

    @PrePersist
    @PreUpdate
    private void onUpdate() {
        this.updateDate = LocalDate.now();
    }

    private int quantity;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Company company;

    // Getters e Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }


    public BloodType getBloodType() { return bloodType; }
    public void setBloodType(BloodType bloodType) { this.bloodType = bloodType; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }

    public LocalDate getUpdateDate() { return updateDate; }
    public void setUpdateDate(LocalDate date) { this.updateDate = date; }


}
