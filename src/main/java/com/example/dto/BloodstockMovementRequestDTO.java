package com.example.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

@Schema(description = "DTO para requisição de movimentação de estoque de sangue") // Anotação movida para a classe principal
public class BloodstockMovementRequestDTO {

    @Schema(description = "ID do item de estoque de sangue a ser movimentado", example = "a1b2c3d4-e5f6-7890-1234-567890abcdef")
    @NotNull(message = "O ID do bloodstock não pode ser nulo")
    private UUID bloodstockId;

    @Schema(description = "Quantidade a ser movimentada (positiva para entrada, negativa para saída)", example = "10")
    @Min(value = 1, message = "A quantidade deve ser pelo menos 1")
    private int quantity;

    // Construtor padrão (necessário para desserialização JSON)
    public BloodstockMovementRequestDTO() {
    }

    public BloodstockMovementRequestDTO(UUID bloodstockId, int quantity) {
        this.bloodstockId = bloodstockId;
        this.quantity = quantity;
    }

    // Getters e Setters
    public UUID getBloodstockId() {
        return bloodstockId;
    }

    public void setBloodstockId(UUID bloodstockId) {
        this.bloodstockId = bloodstockId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    @Override
    public String toString() {
        return "BloodstockMovementRequestDTO{" +
                "bloodstockId=" + bloodstockId +
                ", quantity=" + quantity +
                '}'
                ;
    }
}