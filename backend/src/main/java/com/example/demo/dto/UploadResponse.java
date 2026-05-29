package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadResponse {
    private Long id;
    private String originalName;
    private String storedName;
    private Long fileSize;
    private String fileType;
    private String status;
    private String message;
}
