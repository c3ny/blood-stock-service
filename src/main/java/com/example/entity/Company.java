package com.example.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.GenericGenerator;
import java.util.UUID;

@Entity
@Table(name = "company")
public class Company {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    private String name;
    private String cnpj;
    private String cnes;

    @Column(name = "institution_name", nullable = false)
    private String institutionName;

    @Column(name = "fk_user_id")
    private UUID fkUserId;

    // Getters e Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }

    public String getCnes() { return cnes; }
    public void setCnes(String cnes) { this.cnes = cnes; }

    public String getInstitutionName() { return institutionName; }
    public void setInstitutionName(String institutionName) { this.institutionName = institutionName; }

    public UUID getFkUserId() { return fkUserId; }
    public void setFkUserId(UUID fkUserId) { this.fkUserId = fkUserId; }
}
