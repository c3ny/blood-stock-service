package com.example.view.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
@JsonIgnoreProperties(ignoreUnknown = true)
public record BatchResponseDTO(
        UUID id,
        String batchCode,
        LocalDate entryDate,
        List<BloodDetailDTO> bloodDetails
) {

    public int totalQuantity() {
        return bloodDetails == null ? 0 :
                bloodDetails.stream()
                        .mapToInt(BloodDetailDTO::quantity)
                        .sum();
    }

    @Override
    public String toString() {
        return "Lote " + batchCode + " (" + totalQuantity() + ")";
    }
}
