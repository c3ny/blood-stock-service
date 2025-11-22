package com.example.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;
import java.util.UUID;
@Data
public class BatchExitBulkRequestDTO {

    @NotNull(message = "O lote é obrigatório")
    private UUID batchId;

    // Ex: {"A+": 2, "O-": 1}
    private Map<String, Integer> quantities;

    public UUID getBatchId() { return batchId; }
    public void setBatchId(UUID batchId) { this.batchId = batchId; }

    public Map<String, Integer> getQuantities() { return quantities; }
    public void setQuantities(Map<String, Integer> quantities) { this.quantities = quantities; }
}
