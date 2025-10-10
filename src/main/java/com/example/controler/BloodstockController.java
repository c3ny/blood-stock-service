package com.example.controler;

import com.example.model.Bloodstock;
import com.example.model.CompanyDTO;
import com.example.service.BloodstockService;
import com.example.service.CompanyService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/stock")
@CrossOrigin(origins = "*")
public class BloodstockController {

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
        return bloodstockService.updateQuantity(id, quantity);
    }

    // Listar todas as companies
    @GetMapping("/company")
    public List<CompanyDTO> listCompanies() {
        return companyService.listAll();

    }

    //Listar estoque da empresa
    @GetMapping("/company/{companyId}")
    public List<Bloodstock> getStockByCompany(@PathVariable UUID companyId) {
        return bloodstockService.findByCompany(companyId);
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
            writer.println(b.getUpdateDate() + "," + b.getQuantity() + "," + b.getUpdateDate());
        }

        writer.flush();
        writer.close();
    }
}
