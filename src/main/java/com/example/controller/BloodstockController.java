package com.example.controller;

import com.example.dto.request.BatchEntryRequestDTO;
import com.example.dto.request.BatchExitBulkRequestDTO;
import com.example.dto.request.BloodstockMovementRequestDTO;
import com.example.dto.response.BatchResponseDTO;
import com.example.dto.response.BloodDetailDTO;
import com.example.entity.Batch;
import com.example.entity.Bloodstock;
import com.example.entity.BloodstockMovement;
import com.example.repository.BloodstockMovementRepository;
import com.example.service.BloodstockService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stock")
@Tag(
        name = "📦 Estoque de Sangue",
        description = "Endpoints responsáveis pela gestão do estoque de sangue. Autorização e autenticação são tratadas externamente pelo UserService."
)
public class BloodstockController {

    private static final Logger log = LogManager.getLogger(BloodstockController.class);

    private final BloodstockService bloodstockService;
    private final BloodstockMovementRepository historyRepository;

    public BloodstockController(
            BloodstockService bloodstockService,
            BloodstockMovementRepository historyRepository
    ) {
        this.bloodstockService = bloodstockService;
        this.historyRepository = historyRepository;
    }

    @Operation(summary = "Criar registro de estoque vinculado a uma empresa")
    @PostMapping("/company/{companyId}")
    public Bloodstock createWithCompany(@Valid @RequestBody Bloodstock bloodstock, @PathVariable UUID companyId) {
        return bloodstockService.save(bloodstock, companyId);
    }

    @Operation(summary = "Listar estoque global")
    @GetMapping
    public List<Bloodstock> listAll() {
        return bloodstockService.listAll();
    }

    @Operation(summary = "Atualizar quantidade de um item do estoque")
    @PutMapping("/{id}")
    public Bloodstock updateQuantity(@PathVariable UUID id, @RequestParam int quantity) {
        return bloodstockService.updateQuantity(id, quantity);
    }

    @Operation(summary = "Movimentação de estoque")
    @PostMapping("/company/{companyId}/movement")
    public ResponseEntity<Bloodstock> moveStock(
            @PathVariable UUID companyId,
            @Valid @RequestBody BloodstockMovementRequestDTO requestDTO
    ) {
        try {
            Bloodstock updated = bloodstockService.updateQuantity(requestDTO.getBloodstockId(), requestDTO.getQuantity());
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            log.error("Erro ao executar movimentação para a empresa {}: {}", companyId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @Operation(summary = "Entrada de estoque por lote")
    @PostMapping("/company/{companyId}/batch-entry")
    public ResponseEntity<List<BatchResponseDTO>> batchEntry(
            @PathVariable UUID companyId,
            @Valid @RequestBody BatchEntryRequestDTO requestDTO
    ) {
        try {
            Batch newBatch = bloodstockService.processBatchEntry(companyId, requestDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(List.of(mapToDto(newBatch)));

        } catch (Exception e) {
            log.error("Erro ao processar entrada de lote para {}: {}", companyId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @Operation(summary = "Saída em lote")
    @PostMapping("/company/{companyId}/batch-exit/bulk")
    public ResponseEntity<?> processBulkExit(
            @PathVariable UUID companyId,
            @Valid @RequestBody BatchExitBulkRequestDTO requestDTO
    ) {
        try {
            bloodstockService.processBulkBatchExit(companyId, requestDTO);
            return ResponseEntity.ok(bloodstockService.findByCompany(companyId));

        } catch (Exception e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @Operation(summary = "Obter estoque de uma empresa")
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Bloodstock>> getStockByCompany(@PathVariable String companyId) {
        try {
            UUID uuid = UUID.fromString(companyId);
            return ResponseEntity.ok(bloodstockService.findByCompany(uuid));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(List.of());
        }
    }

    @Operation(summary = "Histórico de movimentações")
    @GetMapping("/{bloodstockId}/history")
    public List<BloodstockMovement> getHistory(@PathVariable UUID bloodstockId) {
        return historyRepository.findAllByBloodstock_IdOrderByUpdateDateDesc(bloodstockId);
    }

    @Operation(summary = "Gerar relatório CSV")
    @GetMapping("/report/{companyId}")
    public void generateReport(@PathVariable UUID companyId, HttpServletResponse response) throws IOException {

        List<Bloodstock> stockList = bloodstockService.findByCompany(companyId);

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"bloodstock_report.csv\"");

        try(PrintWriter writer = response.getWriter()) {
            writer.println("Blood Type,Quantity,Date");
            stockList.forEach(b -> writer.println(
                    b.getBloodType() + "," + b.getQuantity() + "," + b.getUpdateDate()
            ));
        }
    }

    private BatchResponseDTO mapToDto(Batch batch) {
        List<BloodDetailDTO> details = batch.getBloodDetails()
                .stream()
                .map(d -> new BloodDetailDTO(d.getId(), d.getBloodType().name(), d.getQuantity()))
                .collect(Collectors.toList());

        return new BatchResponseDTO(
                batch.getId(),
                batch.getBatchCode(),
                batch.getEntryDate(),
                details
        );
    }
}
