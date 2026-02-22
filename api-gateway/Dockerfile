FROM maven:3.9.9-eclipse-temurin-21 AS Builder

WORKDIR /app

COPY pom.xml .
COPY patient-service/pom.xml patient-service/
COPY billing-service/pom.xml billing-service/
COPY analytics-service/pom.xml analytics-service/
COPY auth-service/pom.xml auth-service/
COPY api-gateway/pom.xml api-gateway/
COPY integration-tests/pom.xml integration-tests/
COPY infrastructure/pom.xml infrastructure/

RUN mvn dependency:go-offline -B -pl api-gateway -am

COPY api-gateway/src api-gateway/src

RUN mvn clean package -pl api-gateway -am -DskipTests

FROM openjdk:21-jdk AS Runner
WORKDIR /app

COPY --from=Builder /app/api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
