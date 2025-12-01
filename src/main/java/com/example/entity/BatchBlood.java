package com.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;


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

    @NotNull(message = "Tipo sanguíneo é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(name = "blood_type", nullable = false)
    private BloodType bloodType;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;


    // 🔹 Construtor padrão exigido pelo JPA
    public BatchBlood() {}

    // 🔹 👇 ESTE É O CONSTRUTOR QUE A COMPILAÇÃO ESTÁ PEDINDO
    public BatchBlood(Batch batch, BloodType bloodType, Integer quantity) {
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

    public BloodType getBloodType() {
        return bloodType;
    }

    public void setBloodType(BloodType bloodType) {
        this.bloodType = bloodType;
    }


    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
