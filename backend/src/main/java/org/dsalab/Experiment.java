package org.dsalab;

import jakarta.persistence.*;

@Entity
@Table(name = "saved_experiments")
public class Experiment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  public Experiment() {}

  public Long getId() {
    return id;
  }

  @Column(nullable = false)
  private Long userId;

  public Long getUserId() {
    return userId;
  }

  public void setUserId(Long value) {
    userId = value;
  }

  @Column(nullable = false)
  private Long algorithmVersionId;

  public Long getAlgorithmVersionId() {
    return algorithmVersionId;
  }

  public void setAlgorithmVersionId(Long value) {
    algorithmVersionId = value;
  }

  @Column(nullable = false, length = 120)
  private String title;

  public String getTitle() {
    return title;
  }

  public void setTitle(String value) {
    title = value;
  }

  @Column(nullable = false, columnDefinition = "json")
  private String inputJson;

  public String getInputJson() {
    return inputJson;
  }

  public void setInputJson(String value) {
    inputJson = value;
  }

  @Column(nullable = false, columnDefinition = "json")
  private String configurationJson;

  public String getConfigurationJson() {
    return configurationJson;
  }

  public void setConfigurationJson(String value) {
    configurationJson = value;
  }

  @Column(nullable = false, length = 32)
  private String engineVersion;

  public String getEngineVersion() {
    return engineVersion;
  }

  public void setEngineVersion(String value) {
    engineVersion = value;
  }

  @Column(nullable = false)
  private java.time.Instant createdAt;

  public java.time.Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(java.time.Instant value) {
    createdAt = value;
  }
}
