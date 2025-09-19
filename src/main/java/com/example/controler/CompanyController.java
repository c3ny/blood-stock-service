package com.example.controler;

import com.example.model.Company;
import com.example.service.CompanyService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/company")
@CrossOrigin(origins = "*")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping
    public List<Company> listAll() {
        return companyService.listAll();
    }

    @GetMapping("/{id}")
    public Company getById(@PathVariable UUID id) {
        return companyService.findById(id);

    }

    @GetMapping("/teste")
    public String teste() {
        return "ok";
    }




}
