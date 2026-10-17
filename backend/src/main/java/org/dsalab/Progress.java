package org.dsalab;
import jakarta.persistence.*;
@Entity @Table(name="lesson_progress")
public class Progress {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 public Progress(){}
 public Long getId(){return id;}
 @Column(nullable=false) private Long userId;
 public Long getUserId(){return userId;}
 public void setUserId(Long value){userId=value;}
 @Column(nullable=false) private Long lessonId;
 public Long getLessonId(){return lessonId;}
 public void setLessonId(Long value){lessonId=value;}
 @Column(nullable=false) private int completion;
 public int getCompletion(){return completion;}
 public void setCompletion(int value){completion=value;}
 @Column(nullable=false) private java.time.Instant updatedAt;
 public java.time.Instant getUpdatedAt(){return updatedAt;}
 public void setUpdatedAt(java.time.Instant value){updatedAt=value;}
}
