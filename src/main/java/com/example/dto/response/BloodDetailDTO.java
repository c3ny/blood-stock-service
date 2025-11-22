package com.example.dto.response;

import java.util.UUID;

public record BloodDetailDTO(
        UUID id,
        String bloodType,
        Integer quantity
) {}
