package com.example.controler;

import com.example.model.Bloodstock;
import com.example.model.Company;
import com.example.service.BloodstockService;
import com.example.service.CompanyService;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/{companyId}")
    public Bloodstock createBloodstock(@PathVariable UUID companyId,
                                       @RequestBody Bloodstock bloodStock) {
        // Aqui usamos a instância injetada, e não a classe
        return bloodstockService.save(companyId, bloodStock);
    }

    // Listar todos os bloodstocks
    @GetMapping
    public List<Bloodstock> listAll() {
        return bloodstockService.listAll();
    }

    // Criar bloodstock sem company (opcional)
    @PostMapping
    public Bloodstock create(@RequestBody Bloodstock bloodstock) {
        return bloodstockService.save(bloodstock);
    }

    // Criar bloodstock vinculado a uma company
    @PostMapping("/company/{companyId}")
    public Bloodstock createWithCompany(@RequestBody Bloodstock bloodstock, @PathVariable UUID companyId) {
        return bloodstockService.save(bloodstock, companyId);
    }

    // Atualizar quantidade de bloodstock
    @PutMapping("/{id}")
    public Bloodstock updateQuantity(@PathVariable UUID id, @RequestParam int quantity) {
        return bloodstockService.updateQuantity(id, quantity);
    }

    // Listar todas as companies (para preencher combobox no front-end)
    @GetMapping("/company")
    public List<Company> listCompanies() {
        return companyService.listAll();
    }


}
