# Services Explained: Enterprise Patient Management System

This document provides an exhaustive analysis of the seven distinct modules that comprise the distributed Enterprise Patient Management System. Built on Java Spring Boot and orchestrated by Apache Maven, this architecture decomposes monolithic design into highly specialized, independently deployable microservices.

## 1. patient-service

The `patient-service` is the foundational domain of the system.
* **Core Responsibility:** It is strictly responsible for persisting and retrieving core patient data schemas.
* **Database & Persistence:** It utilizes Spring Data JPA and the Hibernate ORM to execute SQL queries against a dedicated PostgreSQL database container, ensuring patient data is physically isolated from other services.
* **Validation:** It actively validates incoming HTTP requests using Jakarta validation constraints to ensure data integrity before persistence.
* **Event Broadcasting:** Upon the successful registration of a new patient, this service instantaneously communicates with the `billing-service` and broadcasts asynchronous events to the `analytics-service` via Apache Kafka.

## 2. billing-service

The `billing-service` is the financial engine of the architecture.
* **Core Responsibility:** It automatically provisions financial accounts via gRPC when a new patient is registered by the `patient-service`.
* **Communication Protocol:** Instead of relying on traditional, text-heavy HTTP REST calls, it utilizes gRPC (gRPC Remote Procedure Calls) and Protocol Buffers (Protobuf) for inter-service communication.
* **Maven Code Generation:** The communication protocol is defined by language-agnostic `.proto` files. During the Maven build lifecycle, specialized plugins (`os-maven-plugin` and `protobuf-maven-plugin`) automatically transpile these blueprints into complex Java network stubs, allowing instantaneous, typed binary communication with the `patient-service`.

## 3. analytics-service

The `analytics-service` acts as the decoupled, data-ingestion mechanism for the system.
* **Core Responsibility:** It subscribes to Apache Kafka event streams to asynchronously log system events.
* **Data Serialization:** The service relies on Protobuf formatting for highly compressed data serialization. When a patient is registered, the event is formatted using a Maven-generated Kafka schema and placed on a Kafka topic, which this service subsequently consumes.

## 4. auth-service

The `auth-service` (Authentication Service) is the security perimeter for identity management.
* **Core Responsibility:** It manages user credentials, handles password encryption, and issues JSON Web Tokens (JWTs).
* **Security Implementation:** It utilizes Spring Security to validate login payloads. Upon successful verification, it computes cryptographically signed JWTs that are used by clients to prove their identity to the rest of the ecosystem.

## 5. api-gateway

The `api-gateway` operates as the singular, secure entry point for external clients interacting with the system.
* **Core Responsibility:** It acts as the singular entry point for external web traffic, validating security tokens before actively routing HTTP requests.
* **Stateless Filtering:** Utilizing Spring Cloud Gateway, it intercepts all incoming web traffic. It cryptographically verifies the JWTs issued by the `auth-service`. If a request lacks a valid token or attempts to access a protected route without authorization, the gateway rejects the request before it reaches the internal microservices network.

## 6. integration-tests

The `integration-tests` module acts as the automated quality assurance framework.
* **Core Responsibility:** It is a standalone testing module engineered to verify cross-service communication.
* **Dependency Scoping:** Through strategic Maven architecture, testing frameworks like `junit-jupiter` and `rest-assured` are injected with a `<scope>test</scope>` constraint. This guarantees that heavy HTTP testing libraries are utilized exclusively during the testing phase and are entirely excluded from the production `.jar` artifacts to maintain lean Docker container sizes and absolute security.

## 7. infrastructure

The `infrastructure` module defines the cloud topology required for production deployment.
* **Core Responsibility:** It is an AWS Cloud Development Kit (CDK) module used to programmatically define cloud resources as Infrastructure as Code (IaC).
* **Cloud Synthesis:** By injecting AWS SDK libraries into the POM, this Java codebase can synthetically blueprint Virtual Private Clouds (VPCs), Elastic Container Service (ECS) clusters, and Relational Database Service (RDS) instances, which are ultimately translated into deployable AWS CloudFormation JSON templates.
