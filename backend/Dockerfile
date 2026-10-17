FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY . .
RUN --mount=type=cache,target=/root/.m2 --mount=type=secret,id=maven_settings --mount=type=secret,id=maven_opts --mount=type=secret,id=java_truststore chmod +x mvnw docker-maven.sh && ./docker-maven.sh package -DskipTests
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/learning-lab-1.0.0.jar app.jar
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
