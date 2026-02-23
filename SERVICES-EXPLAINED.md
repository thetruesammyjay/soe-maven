# Services Explained

This document details the functionality and architecture of each distinct module within the Enterprise Patient Management System. This architecture utilizes a microservices paradigm, meaning that the overall business capability is divided among specialized, independently deployable modules.

## 1. patient-service

The `patient-service` is the core data-persistence module. Its primary responsibility is managing the lifecycle of a patient within the system. 

*   **Functionality**: It accepts HTTP REST requests from the API Gateway to create, retrieve, update, and delete patient records. It validates input payloads ensuring data integrity (e.g., verifying email formats and required fields).
*   **Database**: This service maintains its own isolated PostgreSQL database schema using Spring Data JPA and the Hibernate ORM, ensuring patient data remains decoupled from other business domains.
*   **Inter-service Communication**:
    *   **Synchronous**: Upon successful patient registration, it immediately invokes the `billing-service` via a high-speed gRPC call to provision a financial accounting profile.
    *   **Asynchronous**: It publishes event payloads ("Patient Created" events) to Apache Kafka topics so other services can react without blocking the patient's HTTP web response. 

## 2. billing-service

The `billing-service` acts as the financial engine for the enterprise architecture. It does not primarily serve raw web traffic; instead, it provides strict internal RPC (Remote Procedure Call) endpoints for other microservices to utilize.

*   **Functionality**: Automatically provisions and manages financial accounts, ledgers, or invoicing linked to the patient ID provided during registration.
*   **Architecture**: It is heavily reliant on Google's Protocol Buffers (`.proto` files). Rather than utilizing standard HTTP JSON APIs which carry significant string parsing overhead, this service exposes binary gRPC endpoints. During the Maven build lifecycle, `protobuf-maven-plugin` synthesizes these `.proto` definitions into executing Java network stubs to guarantee instant, typed communication between the patient and billing services.

## 3. analytics-service

The `analytics-service` operates as a decoupled data-ingestion engine. It is completely isolated from the synchronous user-facing API request paths.

*   **Functionality**: It acts primarily as an Apache Kafka consumer. It subscribes to event streams (such as patient registration events or billing updates) broadcasted by other microservices. Its purpose is to ingest, log, process, and potentially aggregate these system events for auditing or dashboarding.
*   **Architecture**: Like the billing service, it utilizes Protobuf to define the schemas of the Kafka messages it expects. This enforces strict contracts on the data flowing through the Kafka broker, drastically reducing parsing errors across the distributed network.

## 4. auth-service

The `auth-service` is the zero-trust security perimeter responsible for identity and access management.

*   **Functionality**: It handles user registration (administrators, staff, or potentially patients), securely hashes passwords using modern cryptographic algorithms (like BCrypt), and validates login credentials. 
*   **Token Issuance**: Upon successful authentication, it computes and issues signed JSON Web Tokens (JWTs). These tokens contain claims regarding the user's role and identity, serving as the decentralized badge required to access secure endpoints across the ecosystem.
*   **Database**: It manages user credentials in an isolated database (configured for PostgreSQL in production or an in-memory H2 database for testing), ensuring patient health data is physically separated from internal login credentials.

## 5. api-gateway

The `api-gateway` acts as the singular, fortified front door for the entire ecosystem. External client interfaces (React web apps, mobile applications) never communicate directly with the underlying microservices.

*   **Functionality**: It utilizes Spring Cloud Gateway to programmatically route incoming HTTP requests to their appropriate internal microservice destinations (e.g., routing `/api/v1/patients` traffic exclusively to the `patient-service`).
*   **Security Enforcement**: Its most critical role is act as a stateless authentication filter. Before forwarding any request, it intercepts the incoming HTTP headers, extracts the JWT provided by the client, and cryptographically verifies its signature against the `auth-service`'s secret. If a token is spoofed or expired, the gateway drops the request before it ever reaches the internal network.

## 6. infrastructure

The `infrastructure` module contains the programmatic blueprints for provisioning the physical (or simulated) cloud environments required to run the system in production.

*   **Functionality**: It utilizes the AWS Cloud Development Kit (CDK) to define Infrastructure as Code (IaC). 
*   **Architecture**: Instead of manually clicking through a web console to create servers, this module contains pure Java code that defines Virtual Private Clouds (VPCs), Application Load Balancers, Relational Database Service (RDS) clusters, and Elastic Container Service (ECS) definitions. Maven injects the necessary AWS SDKs, allowing this Java code to be synthesized into standard JSON CloudFormation templates that accurately deploy the containerized microservices to the cloud.

## 7. integration-tests

The `integration-tests` module acts as the automated quality assurance framework for the entire distributed architecture.

*   **Functionality**: Once the microservices are deployed locally via Docker Compose, this module executes comprehensive, cross-service HTTP test suites. It utilizes the RestAssured framework to mimic a real-world client—attempting to log in via the `auth-service`, capture the JWT, format a complex patient payload, and transmit the request through the `api-gateway`.
*   **Architecture**: This is deliberately constructed as a standalone Maven module utilizing the `<scope>test</scope>` constraint. This architectural decision prevents massive testing libraries (JUnit, RestAssured) from being packaged into the production `.jar` artifacts of the core services, ensuring the production Docker containers remain lightweight and secure.
