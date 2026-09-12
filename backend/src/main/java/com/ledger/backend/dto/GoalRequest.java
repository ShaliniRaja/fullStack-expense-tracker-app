package com.ledger.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GoalRequest {

    @NotBlank
    @Size(max = 30)
    private String icon;

    @NotBlank
    @Size(max = 80)
    private String name;

    @NotNull
    @PositiveOrZero
    private Double target;

    @NotNull
    @PositiveOrZero
    private Double saved;

    @NotNull
    @PositiveOrZero
    private Integer days;
}
