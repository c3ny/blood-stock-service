package com.example.blood_stock_service.controller;

import com.example.blood_stock_service.model.Bloodstock;
import com.example.blood_stock_service.service.BloodstockService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/estoque")
@CrossOrigin(origins = "*")
public class BloodstockController {

    private final BloodstockService service;

    public BloodstockController(BloodstockService service) {
        this.service = service;
    }

    @PostMapping
    public Bloodstock criar(@RequestBody Bloodstock bloodstock) {
        return service.salvar(bloodstock);
    }


    @GetMapping
    public List<Bloodstock> listar() {
        return service.listarTodos();
    }

    @PostMapping("/{companyId}")
    public Bloodstock criar(@RequestBody Bloodstock bloodstock, @PathVariable UUID companyId) {
        return service.salvar(bloodstock, companyId);
    }


    @PutMapping("/{id}")
    public Bloodstock atualizar(@PathVariable UUID id, @RequestParam int quantidade) {
        return service.atualizarQuantidade(id, quantidade);
    }
}
