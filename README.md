# Literati Digital Library - Client Application

This repository contains the **React client application** for the Literati digital library system.

## Project Structure

This is currently a **client-only repository** containing:
- `client2/` - React application with Vite, Tailwind CSS, and Material Design 3
- CI/CD pipeline for automated testing and Docker builds
- Docker configuration for containerized deployment

## Related Services

The complete Literati system includes additional services that are managed separately:
- **literati-server** - Express.js backend with Supabase integration
- **literati-ai** - FastAPI service for AI-powered note summarization

These services have their own Docker repositories and will be integrated when added to this monorepo.

## Docker Deployment

The current docker-compose.yml builds and runs only the client service. Run with:

```bash
docker-compose up --build
```

The client will be available at http://localhost:3000

## CI/CD Pipeline

- **GitHub Actions** automatically test and build the client on push/PR
- **Docker Hub** integration builds and pushes container images
- **Testing** includes unit tests with Vitest and Docker integration tests
