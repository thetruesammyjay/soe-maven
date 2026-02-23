# AWS Cloud Deployment Strategy

This document outlines the exact DevOps pipeline required to successfully deploy the Maven-orchestrated Microservices system to Amazon Web Services (AWS) for your upcoming academic presentation.

Given the architecture of this project—which heavily relies on Multi-Stage Docker builds and the AWS Cloud Development Kit (CDK)—we will bypass manual server configuration and utilize a modern, enterprise-grade deployment strategy.

## Phase 1: Preparation (Before the Presentation)

Before presenting, you must ensure your local environment and AWS account are properly authenticated.

1.  **Create an AWS Account**: Ensure you have an active AWS account with billing/free-tier enabled.
2.  **Install the AWS CLI**: Download and install the [AWS Command Line Interface](https://aws.amazon.com/cli/).
3.  **Authenticate the CLI**: Run `aws configure` in your terminal. You will need to provide:
    *   `AWS Access Key ID` (Generated from AWS IAM Dashboard)
    *   `AWS Secret Access Key`
    *   `Default region name` (e.g., `us-east-1`)
4.  **Install Node.js & AWS CDK**: The infrastructure module requires the CDK command-line tool.
    *   Install Node.js from their official site.
    *   Run `npm install -g aws-cdk` to install the CDK.

## Phase 2: Building the Artifacts via Maven

Before AWS can run the applications, Maven must transpile the gRPC `.proto` schemas and package the executable `.jar` files.

If you do not have Java 21 or Maven installed locally, **you must rely on the Docker Multi-Stage Builds.**

1.  Ensure **Docker Desktop** is running on your presentation machine.
2.  Open a terminal in the root of the `soe-maven` directory.
3.  Run the following command to build the Docker images locally:
    ```bash
    docker compose build
    ```
    *This will trigger the multi-stage Maven build inside the containers, ensuring all dependencies are cached and the Java networking stubs are automatically generated.*

## Phase 3: Infrastructure Deployment (AWS CDK)

This project contains an `infrastructure` module designed specifically for declarative AWS deployment.

1.  Navigate into the Infrastructure module:
    ```bash
    cd infrastructure
    ```
2.  **Bootstrap the CDK**: This prepares your AWS account to receive CDK deployments (only required once per AWS account/region):
    ```bash
    cdk bootstrap
    ```
3.  **Synthesize the CloudFormation Template**: This converts the Java definitions in your infrastructure module into JSON templates AWS can understand:
    ```bash
    cdk synth
    ```
4.  **Deploy the Topology**: Execute the deployment. The CDK will automatically provision the VPC (Virtual Private Cloud), ECS (Elastic Container Service) clusters, and the RDS (PostgreSQL) databases required for the microservices.
    ```bash
    cdk deploy
    ```

## Phase 4: Pushing Docker Images to AWS ECR

Once the infrastructure is active, AWS needs the actual application files to run. We will push the Docker images built in Phase 2 to **Amazon Elastic Container Registry (ECR)**.

1.  Log in to your AWS Console and navigate to **ECR**.
2.  Create 5 separate private repositories named:
    *   `patient-service`
    *   `billing-service`
    *   `analytics-service`
    *   `auth-service`
    *   `api-gateway`
3.  Inside each ECR repository, click **"View push commands"**. AWS will provide you with the exact terminal commands required to Tag and Push your local Docker images up to the AWS cloud.

## Phase 5: The Presentation Talking Points

During your presentation, focus the lecturers' attention on the automated CI/CD and IaC aspects of this architecture:

*   **Apache Maven Orchestration**: Explain how Maven manages the complex dependency trees across 7 modules and automatically synthesizes thousands of lines of gRPC networking code using the `protobuf-maven-plugin`.
*   **Infrastructure as Code (IaC)**: Highlight that the AWS infrastructure wasn't manually clicked together in a console, but systematically defined using the AWS CDK within the `infrastructure` Maven module.
*   **Multi-Stage Docker Optimization**: Detail how the Dockerfiles utilize the `maven:3.9.9` image to build the artifacts offline (using `mvn dependency:go-offline`), before moving strictly the `.jar` files into lightweight `openjdk` runtime containers.
*   **Automated Verification**: Show them the `.github/workflows/maven.yml` file, proving that every push to the `main` branch automatically boots a cloud runner to verify the integrity of the Maven compilation lifecycle.
