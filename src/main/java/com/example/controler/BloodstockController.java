package com.example.controler;

import com.example.model.Bloodstock;
import com.example.model.CompanyDTO;
import com.example.service.BloodstockService;
import com.example.service.CompanyService;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/stock")
@CrossOrigin(origins = "*")
public class BloodstockController {

    private static final Logger log = LogManager.getLogger(BloodstockController.class);
    private final BloodstockService bloodstockService;
    private final CompanyService companyService;

    public BloodstockController(BloodstockService bloodstockService, CompanyService companyService) {
        this.bloodstockService = bloodstockService;
        this.companyService = companyService;
    }

    // Criar bloodstock vinculado a uma company
    @PostMapping("/company/{companyId}")
    public Bloodstock createWithCompany(@RequestBody Bloodstock bloodstock, @PathVariable UUID companyId) {
        return bloodstockService.save(bloodstock, companyId);
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

    //Listar estoque da empresa
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Bloodstock>> getStockByCompany(@PathVariable String companyId) {
        try {
            // Validar se o companyId é um UUID válido
            UUID uuid;
            try {
                uuid = UUID.fromString(companyId);
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest()
                        .body(List.of()); // Retorna 400 se o UUID for inválido
            }

            // Checar se a empresa existe
            if (!companyService.existsById(uuid)) {
                return ResponseEntity.notFound().build(); // 404 se a empresa não existe
            }

            // Buscar estoque
            List<Bloodstock> stockList = bloodstockService.findByCompany(uuid);
            return ResponseEntity.ok(stockList);

        } catch (Exception e) {
            e.printStackTrace(); // Log do erro
            return ResponseEntity.status(500).body(List.of()); // 500 em caso de falha no servidor
        }
    }



    @PostMapping("/company/{companyId}/movement")
    public ResponseEntity<Bloodstock> moveStock(
            @PathVariable UUID companyId,
            @RequestBody Map<String, Object> request) {

        UUID bloodstockId = UUID.fromString((String) request.get("bloodstockId"));
        int quantity = (int) request.get("quantity");
        String currentUser = "admin";

        Bloodstock updated = bloodstockService.updateQuantity(bloodstockId, quantity, currentUser);
        return ResponseEntity.ok(updated);
    }



    // Gerar relatório CSV filtrando por company
    @GetMapping("/report/{companyId}")
    public void generateReport(@PathVariable UUID companyId, HttpServletResponse response) throws IOException {
        List<Bloodstock> stockList = bloodstockService.findByCompany(companyId);

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"bloodstock_report.csv\"");

        PrintWriter writer = response.getWriter();
        writer.println("Blood Type,Quantity,Date");

        for (Bloodstock b : stockList) {
            writer.println(b.getUpdateDate() + "," + b.getQuantity());
        }

        writer.flush();
        writer.close();
    }
}
