package com.example.view.dto;

import java.util.UUID;

public record BloodDetailDTO(
        UUID id,
        String bloodType,
        Integer quantity
) {}
