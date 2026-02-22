# Enterprise Patient Management System

This repository contains the source code for a distributed Enterprise Patient Management System. The architecture utilizes a microservices strategy built on Java Spring Boot, leveraging Apache Maven as the central orchestrator for dependency management, code generation, and multi-stage containerization.

## Architecture Overview

The system decomposes traditional monolithic health management into distinct, highly independent computing modules communicating over a secure network via gRPC, HTTP, and asynchronous event streams using Apache Kafka.

### Microservices Modules

1. **patient-service**: Core service responsible for persisting and retrieving primary patient data schemas utilizing PostgreSQL and Hibernate ORM.
2. **billing-service**: Provisions financial accounts. Interacts instantaneously with the patient-service via gRPC.
3. **analytics-service**: Asynchronously subscribes to Apache Kafka event streams to log critical system health events and patient updates.
4. **auth-service**: Manages user credentials, password encryption, and issues JSON Web Tokens (JWTs) using an embedded H2 database for secure local testing or PostgreSQL in production.
5. **api-gateway**: The singular entry point for external web traffic. It implements Spring Cloud Gateway to validate security tokens before routing HTTP requests to internal microservices.

### Testing and Infrastructure

*   **integration-tests**: A standalone Maven testing module utilizing JUnit 5 and RestAssured to verify cross-service HTTP communication securely decoupled from production code.
*   **infrastructure**: Provides Infrastructure as Code (IaC) utilizing the AWS Cloud Development Kit (CDK) to programmatically define cloud topologies suitable for deployment on ECS, RDS, and Application Load Balancers.

## Maven Orchestration

This system utilizes a Multi-Module Maven structure. The root directory contains an aggregator `pom.xml` that drives the build lifecycle for the entire architecture.

### Dependency Management
Maven seamlessly handles the declarative injection of Spring Cloud dependencies and ensures strict version parity across all services by inheriting properties from the root `pom.xml`.

### Automated Protobuf transpilation
Instead of manually mapping TCP network instructions, the system relies on `.proto` schemas for inter-service communication. By running `mvn compile`, the `os-maven-plugin` and `protobuf-maven-plugin` autonomously download Google's Protocol Buffer compilers and synthesize low-level Java networking stubs required for gRPC and Kafka serialization into the respective `target/generated-sources` directories.

## Building and Containerization

The deployment strategy relies completely on Multi-Stage Docker builds synchronized with Maven. This bypasses the need for host machines to manage JVM versions or download dependency trees.

### Running the System Locally

1. Ensure Docker and Docker Compose are installed and running.
2. Build and start the infrastructure and services from the root directory:

```bash
docker compose up --build
```

### Understanding the Container Build Process

During the build process mapped in the component `Dockerfile`s:
1. Docker instantiates a heavyweight Maven builder environment (`maven:3.9.9-eclipse-temurin-21`).
2. Maven executes `mvn dependency:go-offline` to aggressively cache the entire dependency tree as an immutable Docker layer.
3. Maven compiles the Fat JAR executable offline.
4. Docker extracts only the lightweight `.jar` into a minimalist Java 21 runtime image (`openjdk:21-jdk`), entirely discarding the Maven daemon and providing a secure, minimal attack surface for production deployments.

## Prerequisites

To interact with this source code manually without Docker, ensure your environment contains:
*   Java Development Kit (JDK) 21
*   Apache Maven 3.9+
*   PostgreSQL 15+ (if running databases natively)
