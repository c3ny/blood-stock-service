package com.example.model;

import com.example.entity.BatchBlood;
import com.example.entity.Company;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.*;

@Entity
@Table(name = "batch")
public class Batch {


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "batch_code", nullable = false)
    private String batchCode;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    // Agora a lista representa todos os tipos sanguíneos deste lote
    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<BatchBlood> bloodDetails = new ArrayList<>();

    // ---- GETTERS / SETTERS ----

    public UUID getId() {
        return id;
    }

    public void addBloodDetail(BatchBlood detail) {
        detail.setBatch(this);
        this.bloodDetails.add(detail);
    }


    public void setId(UUID id) {
        this.id = id;
    }

    public String getBatchCode() {
        return batchCode;
    }

    public void setBatchCode(String batchCode) {
        this.batchCode = batchCode;
    }

    public LocalDate getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(LocalDate entryDate) {
        this.entryDate = entryDate;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public List<BatchBlood> getBloodDetails() {
        return bloodDetails;
    }

    public void setBloodDetails(List<BatchBlood> bloodDetails) {
        this.bloodDetails = bloodDetails;
    }
}
