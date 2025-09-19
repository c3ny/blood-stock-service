package com.example.controler;

import com.example.model.Bloodstock;
import com.example.service.BloodstockService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/stock")
@CrossOrigin(origins = "*")
public class BloodstockController {

    private final BloodstockService service;

    public BloodstockController(BloodstockService service) {
        this.service = service;
    }

    @PostMapping
    public Bloodstock create(@RequestBody Bloodstock bloodstock) {
        return service.save(bloodstock);
    }


    @GetMapping
    public List<Bloodstock> list() {
        return service.listAll();
    }

    @PostMapping("/{companyId}")
    public Bloodstock create(@RequestBody Bloodstock bloodstock, @PathVariable UUID companyId) {
        return service.save(bloodstock, companyId);
    }

    @PutMapping("/{id}")
    public Bloodstock update(@PathVariable UUID id, @RequestParam int quantity) {
        return service.updateQuantity(id, quantity);
    }
}
