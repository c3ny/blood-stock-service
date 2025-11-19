package com.example.controler;

import com.example.model.*;
import com.example.respository.BloodstockMovementRepository;
import com.example.service.BloodstockService;
import com.example.service.CompanyService;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.exception.InsufficientStockException;
import jakarta.validation.Valid;
import com.example.model.Bloodstock;
import com.example.service.BloodstockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/stock")
@CrossOrigin(origins = "*")
@Tag(name = "Estoque de Sangue", description = "Operações relacionadas ao gerenciamento de estoque de sangue")
public class BloodstockController {

    private static final Logger log = LogManager.getLogger(BloodstockController.class);
    private final BloodstockService bloodstockService;
    private final CompanyService companyService;
    private final BloodstockMovementRepository historyRepository;

    public BloodstockController(
            BloodstockService bloodstockService,
            CompanyService companyService,
            BloodstockMovementRepository historyRepository
    ) {
        this.bloodstockService = bloodstockService;
        this.companyService = companyService;
        this.historyRepository = historyRepository;
    }

    // Criar bloodstock vinculado a uma company
    @PostMapping("/company/{companyId}")
    public Bloodstock createWithCompany(@RequestBody Bloodstock bloodstock, @PathVariable UUID companyId) {
        return bloodstockService.save(bloodstock, companyId);
    }


    @PostMapping("/company/{companyId}/batch-exit/bulk")
    public ResponseEntity<?> processBulkExit(
            @PathVariable UUID companyId,
            @Valid @RequestBody BatchExitBulkRequestDTO requestDTO
    ) {
        try {
            bloodstockService.processBulkBatchExit(companyId, requestDTO);
            return ResponseEntity.ok("Saída registrada com sucesso.");
        } catch (Exception e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }


    // Criar bloodstock sem company
    @PostMapping
    public Bloodstock create(@RequestBody Bloodstock bloodstock) {
        return bloodstockService.save(bloodstock);
    }

    // Listar todos os bloodstocks
    @GetMapping
    public List<Bloodstock> listAll() {
        return bloodstockService.listAll();
    }

    // Atualizar quantidade de bloodstock
    @PutMapping("/{id}")
    public Bloodstock updateQuantity(@PathVariable UUID id, @RequestParam int quantity) {
        String currentUser = "admin";
        return bloodstockService.updateQuantity(id, quantity, currentUser);
    }

    // Listar todas as companies
    @GetMapping("/company")
    public List<CompanyDTO> listCompanies() {
        return companyService.listAll();
    }

    // Listar estoque da empresa
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Bloodstock>> getStockByCompany(@PathVariable String companyId) {
        try {
            UUID uuid;
            try {
                uuid = UUID.fromString(companyId);
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(List.of());
            }

            if (!companyService.existsById(uuid)) {
                return ResponseEntity.notFound().build();
            }

            List<Bloodstock> stockList = bloodstockService.findByCompany(uuid);
            return ResponseEntity.ok(stockList);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(List.of());
        }
    }

    // Histórico por Bloodstock
    @GetMapping("/{bloodstockId}/history")
    public List<BloodstockMovement> getHistory(@PathVariable UUID bloodstockId) {
        return historyRepository.findAllByBloodstock_IdOrderByUpdateDateDesc(bloodstockId);
    }

    // Atualizar estoque via movimento
    @PostMapping("/company/{companyId}/movement")
    public ResponseEntity<Bloodstock> moveStock(
            @PathVariable UUID companyId,
            @Valid @RequestBody BloodstockMovementRequestDTO requestDTO // Usar o DTO e @Valid
    ) {
        try {
            // Os dados já vêm tipados e validados pelo DTO
            UUID bloodstockId = requestDTO.getBloodstockId();
            int quantity = requestDTO.getQuantity();
            String currentUser = "admin"; // Considerar implementar autenticação real (Sugestão 1)

            Bloodstock updated = bloodstockService.updateQuantity(bloodstockId, quantity, currentUser);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Erro ao mover estoque para a empresa {}: {}", companyId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Gerar relatório CSV do estoque
    @GetMapping("/report/{companyId}")
    public void generateReport(@PathVariable UUID companyId, HttpServletResponse response) throws IOException {
        List<Bloodstock> stockList = bloodstockService.findByCompany(companyId);

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"bloodstock_report.csv\"");

        PrintWriter writer = response.getWriter();
        writer.println("Blood Type,Quantity,Date");

        for (Bloodstock b : stockList) {
            writer.println(b.getBloodType() + "," + b.getQuantity() + "," + b.getUpdateDate());
        }

        writer.flush();
        writer.close();
    }

    // Listar lotes disponíveis por empresa
    @GetMapping("/company/{companyId}/batches")
    public ResponseEntity<List<Batch>> getAvailableBatches(@PathVariable UUID companyId) {
        try {
            List<Batch> batches = bloodstockService.getAvailableBatches(companyId);
            return ResponseEntity.ok(batches);
        } catch (Exception e) {
            log.error("Erro ao listar lotes disponíveis para a empresa {}: {}", companyId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }


    // Entrada de estoque por lote
    @PostMapping("/company/{companyId}/batch-entry")
    public ResponseEntity<List<Batch>> batchEntry(
            @PathVariable UUID companyId,
            @Valid @RequestBody BatchEntryRequestDTO requestDTO
    ) {
        try {
            Batch newBatch = bloodstockService.processBatchEntry(companyId, requestDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(List.of(newBatch));

        } catch (Exception e) {
            log.error("Erro ao processar entrada de lote para a empresa {}: {}", companyId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ✅ Novo endpoint correto para relatório do histórico por empresa
    @GetMapping("/history/report/{companyId}")
    public ResponseEntity<List<BloodstockMovement>> getHistoryReportByCompany(@PathVariable UUID companyId) {
        try {
            List<BloodstockMovement> history =
                    historyRepository.findByBloodstock_Company_IdOrderByActionDateDesc(companyId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList());
        }
    }
}
