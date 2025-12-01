package com.example.mapper;

import com.example.dto.response.BloodstockDTO;
import com.example.entity.Bloodstock;
import com.example.entity.BloodType;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(
        componentModel = "spring",
        imports = {BloodType.class},
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface BloodstockMapper {

    BloodstockMapper INSTANCE = Mappers.getMapper(BloodstockMapper.class);

    @Mapping(target = "company", ignore = true)
    @Mapping(target = "bloodType",
            expression = "java(dto.getBloodType() != null ? BloodType.valueOf(dto.getBloodType()) : null)")
    Bloodstock toEntity(BloodstockDTO dto);

    @Mapping(target = "bloodType",
            expression = "java(entity.getBloodType() != null ? entity.getBloodType().name() : null)")
    BloodstockDTO toDTO(Bloodstock entity);
}
