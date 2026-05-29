package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private Long id;
    private String originalName;
    private String storedName;
    private String filePath;
    private Long fileSize;
    private String fileType;
    private String status;
    private String uploadedAt;
}
