package com.example.entity;

import com.example.model.Batch;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "batch_blood")
public class BatchBlood {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    @JsonIgnore
    private Batch batch;


    @Column(name = "blood_type", nullable = false)
    private String bloodType;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;


    // 🔹 Construtor padrão exigido pelo JPA
    public BatchBlood() {}

    // 🔹 👇 ESTE É O CONSTRUTOR QUE A COMPILAÇÃO ESTÁ PEDINDO
    public BatchBlood(Batch batch, String bloodType, Integer quantity) {
        this.batch = batch;
        this.bloodType = bloodType;
        this.quantity = quantity;
    }


    // GETTERS & SETTERS

    public UUID getId() {
        return id;
    }

    public Batch getBatch() {
        return batch;
    }

    public void setBatch(Batch batch) {
        this.batch = batch;
    }

    public String getBloodType() {
        return bloodType;
    }

    public void setBloodType(String bloodType) {
        this.bloodType = bloodType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
