# Stage 1: Build the application jar using Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies first to cache them
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Create a lightweight runtime container
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/hemoconnect-1.0.0.jar app.jar

# Expose the port Spring Boot runs on (Cloud Run injects PORT environment variable)
EXPOSE 8080

# Run Spring Boot with optimized JVM memory allocations for cloud environments
ENTRYPOINT ["java", "-XX:+UseG1GC", "-jar", "app.jar"]
