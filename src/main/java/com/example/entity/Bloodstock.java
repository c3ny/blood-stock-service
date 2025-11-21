package com.example.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonProperty;

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

    @Column(name = "blood_type")
    @JsonProperty("blood_type")
    private String bloodType;

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

    public String getBloodType() { return bloodType; }
    public void setBloodType(String bloodType) { this.bloodType = bloodType; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }

    public LocalDate getUpdateDate() { return updateDate; }
    public void setUpdateDate(LocalDate date) { this.updateDate = date; }


}
