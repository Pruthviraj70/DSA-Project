package org.dsalab;
import jakarta.persistence.*;
@Entity @Table(name="users")
public class LabUser {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 public LabUser(){}
 public Long getId(){return id;}
 @Column(nullable=false,unique=true,length=254) private String email;
 public String getEmail(){return email;}
 public void setEmail(String value){email=value;}
 @Column(nullable=false,length=80) private String displayName;
 public String getDisplayName(){return displayName;}
 public void setDisplayName(String value){displayName=value;}
 @Column(nullable=false,length=100) private String passwordHash;
 public String getPasswordHash(){return passwordHash;}
 public void setPasswordHash(String value){passwordHash=value;}
}
