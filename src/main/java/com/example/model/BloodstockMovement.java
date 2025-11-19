package com.example.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bloodstock_movement")
public class BloodstockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "bloodstock_id")
    private Bloodstock bloodstock;

    private int movement;
    private int quantityBefore;
    private int quantityAfter;
    private String actionBy;
    private LocalDateTime actionDate;
    private String notes;


    @Column(name = "update_date")
    private LocalDateTime updateDate;
    @PrePersist
    @PreUpdate
    private void onUpdate() {
        this.updateDate = LocalDateTime.now();
    }

    public BloodstockMovement() {
    }

    public BloodstockMovement(int quantityBefore, int quantityAfter, String actionBy, String notes, UUID batchId) {
        this.movement = quantityAfter < quantityBefore ? -1 : 1;
        this.quantityBefore = quantityBefore;
        this.quantityAfter = quantityAfter;
        this.actionBy = actionBy;
        this.notes = notes != null ? notes : "Movimentação por lote: " + batchId;
        this.actionDate = LocalDateTime.now();
    }




    // Getters e Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Bloodstock getBloodstock() {
        return bloodstock;
    }

    public void setBloodstock(Bloodstock bloodstock) {
        this.bloodstock = bloodstock;
    }

    public int getMovement() {
        return movement;
    }

    public void setMovement(int movement) {
        this.movement = movement;
    }

    public int getQuantityBefore() {
        return quantityBefore;
    }

    public void setQuantityBefore(int quantityBefore) {
        this.quantityBefore = quantityBefore;
    }

    public int getQuantityAfter() {
        return quantityAfter;
    }

    public void setQuantityAfter(int quantityAfter) {
        this.quantityAfter = quantityAfter;
    }

    public String getActionBy() {
        return actionBy;
    }

    public void setActionBy(String actionBy) {
        this.actionBy = actionBy;
    }

    public LocalDateTime getActionDate() {
        return actionDate;
    }

    public void setActionDate(LocalDateTime actionDate) {
        this.actionDate = actionDate;
    }

    public LocalDateTime getUpdateDate() {
        return updateDate;
    }

    public void setUpdateDate(LocalDateTime updateDate) {
        this.updateDate = updateDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

}
