package com.example.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.UUID;
@Data
public class BatchExitRequestDTO {

    @NotNull(message = "O ID do lote é obrigatório")
    private UUID batchId;

    @Positive(message = "A quantidade de saída deve ser positiva")
    private int quantity;

    // Getters e Setters
    public UUID getBatchId() {
        return batchId;
    }

    public void setBatchId(UUID batchId) {
        this.batchId = batchId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }


}
