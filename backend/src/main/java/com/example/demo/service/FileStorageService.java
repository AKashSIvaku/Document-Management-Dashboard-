package com.example.demo.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private Path uploadPath;

    @PostConstruct
    public void init() {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + this.uploadPath, e);
        }
    }

    /**
     * Stores a file to disk with a UUID-generated name.
     * Returns the stored filename (UUID + original extension).
     */
    public String storeFile(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String storedName = UUID.randomUUID().toString() + extension;

        try {
            Path targetLocation = this.uploadPath.resolve(storedName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return storedName;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file " + originalFilename, e);
        }
    }

    /**
     * Loads a file as a Spring Resource for download.
     */
    public Resource loadFile(String storedName) {
        try {
            Path filePath = this.uploadPath.resolve(storedName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found: " + storedName);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("File not found: " + storedName, e);
        }
    }

    /**
     * Deletes a file from disk.
     */
    public void deleteFile(String storedName) {
        try {
            Path filePath = this.uploadPath.resolve(storedName).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Could not delete file: " + storedName, e);
        }
    }

    /**
     * Returns the upload directory Path.
     */
    public Path getUploadPath() {
        return this.uploadPath;
    }
}
