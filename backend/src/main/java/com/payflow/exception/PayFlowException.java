package com.payflow.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class PayFlowException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus httpStatus;

    public PayFlowException(String message, String errorCode, HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public static PayFlowException notFound(String message) {
        return new PayFlowException(message, "NOT_FOUND", HttpStatus.NOT_FOUND);
    }
    public static PayFlowException badRequest(String message) {
        return new PayFlowException(message, "BAD_REQUEST", HttpStatus.BAD_REQUEST);
    }
    public static PayFlowException badRequest(String message, String errorCode) {
        return new PayFlowException(message, errorCode, HttpStatus.BAD_REQUEST);
    }
    public static PayFlowException conflict(String message) {
        return new PayFlowException(message, "CONFLICT", HttpStatus.CONFLICT);
    }
    public static PayFlowException forbidden(String message) {
        return new PayFlowException(message, "FORBIDDEN", HttpStatus.FORBIDDEN);
    }
    public static PayFlowException unauthorized(String message) {
        return new PayFlowException(message, "UNAUTHORIZED", HttpStatus.UNAUTHORIZED);
    }
    public static PayFlowException unprocessable(String message) {
        return new PayFlowException(message, "UNPROCESSABLE_ENTITY", HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
