package com.pantrka.backend.domain.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class NewArrivalMoveRequest {

    public enum Direction { UP, DOWN }

    @NotNull
    private Direction direction;
}
