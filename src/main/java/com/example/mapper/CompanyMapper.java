package com.example.mapper;

import com.example.entity.Company;
import com.example.dto.response.CompanyDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CompanyMapper {

    @Mapping(target = "name", expression = "java(company.getName() != null ? company.getName() : company.getInstitutionName())")
    CompanyDTO toDTO(Company company);

    @Mapping(target = "cnpj", ignore = true)
    @Mapping(target = "cnes", ignore = true)
    @Mapping(target = "fkUserId", ignore = true)
    Company toEntity(CompanyDTO dto);
}
