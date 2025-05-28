# Backend Development Request

## Overview
Please analyze the requirements and architecture documentation in the "requirements" folder, review the existing codebase, and implement a comprehensive backend solution for the application.

## Tasks

### 1. Requirements Analysis
- **Read and analyze** all documentation files in the `requirements/` directory
- **Identify** functional and non-functional requirements
- **Extract** key features, user stories, and business logic requirements
- **Note** any API specifications, data models, or integration requirements
- **Document** any unclear or missing requirements that need clarification

### 2. Architecture Review
- **Examine** existing architecture diagrams, system design documents, and technical specifications
- **Understand** the proposed system architecture, technology stack, and design patterns
- **Identify** database schema requirements, API endpoints, and service boundaries
- **Review** scalability, security, and performance considerations

### 3. Existing Code Analysis
- **Scan** the current codebase to understand:
  - Project structure and organization
  - Existing technologies and frameworks in use
  - Code patterns and conventions
  - Database connections and configurations
  - Authentication/authorization mechanisms
  - API routes or endpoints already implemented
- **Identify** what's already built vs. what needs to be implemented
- **Ensure compatibility** with existing frontend or client applications

### 4. Backend Implementation
Based on your analysis, please implement:

#### Core Infrastructure
- **Project setup** with appropriate folder structure and configuration
- **Database setup** including schema, migrations, and seed data
- **Environment configuration** and secrets management
- **Logging and monitoring** setup

#### API Development
- **RESTful API endpoints** covering all required functionality
- **Request/response validation** and error handling
- **Authentication and authorization** implementation
- **API documentation** (OpenAPI/Swagger if applicable)

#### Business Logic
- **Service layer** implementation for core business operations
- **Data access layer** with appropriate ORM/database interactions
- **Background jobs** or scheduled tasks if needed
- **External integrations** as specified in requirements

#### Quality & Security
- **Input validation** and sanitization
- **Security headers** and CORS configuration
- **Rate limiting** and DDoS protection
- **Unit tests** for critical business logic
- **Integration tests** for API endpoints

## Deliverables
1. **Analysis Summary**: Brief report of findings from requirements and architecture review
2. **Implementation Plan**: Overview of the technical approach and key decisions
3. **Complete Backend Code**: Fully functional backend application
4. **Database Schema**: DDL scripts or migration files
5. **API Documentation**: Endpoint documentation with examples
6. **Setup Instructions**: README with installation and deployment steps
7. **Testing Suite**: Unit and integration tests

## Technology Stack Requirements
- **Frontend**: The application frontend is built in **TypeScript**
- **Backend**: Implement the backend using **Node.js** with appropriate frameworks (Express.js, Fastify, or similar)
- **Language**: Use **TypeScript** for the backend to maintain consistency with the frontend
- **Database**: Choose appropriate database technology based on requirements analysis

## Technical Preferences
- Follow **industry best practices** for Node.js/TypeScript development
- Implement **clean architecture** principles with proper separation of concerns
- Use **dependency injection** and **SOLID principles** where applicable
- Ensure **code maintainability** with clear documentation and comments
- Implement **proper error handling** and logging throughout the application
- **Type safety**: Leverage TypeScript's type system for robust code
- **Shared types**: Consider creating shared type definitions between frontend and backend

## Additional Considerations
- **Performance optimization** for expected load patterns
- **Scalability considerations** for future growth
- **Security best practices** including data protection and access control
- **Monitoring and observability** for production deployment
- **Docker containerization** if not already present

Please start by analyzing the requirements folder and existing code, then provide your implementation plan before proceeding with the development.
