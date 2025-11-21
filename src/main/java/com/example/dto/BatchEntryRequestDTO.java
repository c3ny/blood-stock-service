package com.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.util.Map;
@Data
public class BatchEntryRequestDTO {

    @NotBlank(message = "O código do lote é obrigatório")
    private String batchCode;

    @NotNull(message = "As quantidades de sangue são obrigatórias")
    private Map<String, @PositiveOrZero(message = "A quantidade deve ser positiva ou zero") Integer> bloodQuantities;

    // Getters e Setters
    public String getBatchCode() {
        return batchCode;
    }

    public void setBatchCode(String batchCode) {
        this.batchCode = batchCode;
    }

    public Map<String, Integer> getBloodQuantities() {
        return bloodQuantities;
    }

    public void setBloodQuantities(Map<String, Integer> bloodQuantities) {
        this.bloodQuantities = bloodQuantities;
    }
}
