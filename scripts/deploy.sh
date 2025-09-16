#!/bin/bash

# Production Deployment Script for Literati Library App
# Handles complete deployment pipeline with safety checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$PROJECT_ROOT/logs/deploy_$TIMESTAMP.log"

# Default values
ENVIRONMENT="production"
SKIP_TESTS=false
SKIP_BACKUP=false
DRY_RUN=false
FORCE_DEPLOY=false

# Functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Help function
show_help() {
    cat << EOF
Literati Production Deployment Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV    Target environment (production, staging) [default: production]
    -t, --skip-tests        Skip running tests before deployment
    -b, --skip-backup       Skip creating backup before deployment
    -d, --dry-run           Show what would be done without executing
    -f, --force             Force deployment even if health checks fail
    -h, --help              Show this help message

Examples:
    $0                      # Deploy to production with all checks
    $0 -e staging           # Deploy to staging environment
    $0 --dry-run            # Preview deployment without executing
    $0 --skip-tests --force # Quick deployment without tests or health checks

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -b|--skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -f|--force)
            FORCE_DEPLOY=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
    error "Invalid environment: $ENVIRONMENT. Must be 'production' or 'staging'"
fi

# Initialize logging
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$BACKUP_DIR"

log "Starting deployment to $ENVIRONMENT environment"
log "Deployment ID: deploy_$TIMESTAMP"

# Pre-deployment checks
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running. Please start Docker first."
    fi

    # Check if required files exist
    required_files=(
        "docker-compose.yml"
        ".env.$ENVIRONMENT"
        "client2/Dockerfile"
        "server2/Dockerfile"
        "ai-service/Dockerfile"
    )

    for file in "${required_files[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
            error "Required file not found: $file"
        fi
    done

    # Check if environment file has required variables
    env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
    required_vars=(
        "NODE_ENV"
        "SUPABASE_URL"
        "JWT_SECRET"
        "DOMAIN"
        "FRONTEND_URL"
    )

    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file"; then
            error "Required environment variable $var not found in $env_file"
        fi
    done

    success "Prerequisites check passed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        warning "Skipping tests (--skip-tests flag used)"
        return
    fi

    log "Running tests..."

    # Client tests
    if [[ -f "$PROJECT_ROOT/client2/package.json" ]]; then
        log "Running client tests..."
        cd "$PROJECT_ROOT/client2"
        if ! pnpm test --passWithNoTests --coverage; then
            error "Client tests failed"
        fi
    fi

    # Server tests
    if [[ -f "$PROJECT_ROOT/server2/package.json" ]]; then
        log "Running server tests..."
        cd "$PROJECT_ROOT/server2"
        if ! pnpm test --passWithNoTests; then
            error "Server tests failed"
        fi
    fi

    # AI service tests
    if [[ -f "$PROJECT_ROOT/ai-service/requirements.txt" ]]; then
        log "Running AI service tests..."
        cd "$PROJECT_ROOT/ai-service"
        if [[ -f "test_main.py" ]]; then
            if ! python -m pytest test_main.py -v; then
                error "AI service tests failed"
            fi
        fi
    fi

    cd "$PROJECT_ROOT"
    success "All tests passed"
}

# Create backup
create_backup() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        warning "Skipping backup (--skip-backup flag used)"
        return
    fi

    log "Creating backup..."

    backup_name="backup_$TIMESTAMP"
    backup_path="$BACKUP_DIR/$backup_name"

    mkdir -p "$backup_path"

    # Backup current deployment
    if docker-compose ps | grep -q "Up"; then
        log "Backing up current deployment state..."
        docker-compose config > "$backup_path/docker-compose.backup.yml"

        # Export current images
        log "Exporting current Docker images..."
        docker save -o "$backup_path/literati-client.tar" literati-client:latest 2>/dev/null || true
        docker save -o "$backup_path/literati-server.tar" literati-server:latest 2>/dev/null || true
        docker save -o "$backup_path/literati-ai.tar" literati-ai:latest 2>/dev/null || true
    fi

    # Backup configuration files
    cp ".env.$ENVIRONMENT" "$backup_path/"
    cp "docker-compose.yml" "$backup_path/"

    if [[ -f "docker-compose.override.yml" ]]; then
        cp "docker-compose.override.yml" "$backup_path/"
    fi

    # Create restore script
    cat > "$backup_path/restore.sh" << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$BACKUP_DIR")")"

echo "Restoring from backup..."

# Stop current deployment
cd "$PROJECT_ROOT"
docker-compose down

# Load backed up images
if [[ -f "$BACKUP_DIR/literati-client.tar" ]]; then
    docker load -i "$BACKUP_DIR/literati-client.tar"
fi

if [[ -f "$BACKUP_DIR/literati-server.tar" ]]; then
    docker load -i "$BACKUP_DIR/literati-server.tar"
fi

if [[ -f "$BACKUP_DIR/literati-ai.tar" ]]; then
    docker load -i "$BACKUP_DIR/literati-ai.tar"
fi

# Restore configuration
cp "$BACKUP_DIR/docker-compose.backup.yml" "$PROJECT_ROOT/docker-compose.yml"

echo "Backup restored. Run 'docker-compose up -d' to start services."
EOF

    chmod +x "$backup_path/restore.sh"

    # Compress backup
    cd "$BACKUP_DIR"
    tar -czf "$backup_name.tar.gz" "$backup_name"
    rm -rf "$backup_name"

    success "Backup created: $BACKUP_DIR/$backup_name.tar.gz"
}

# Build images
build_images() {
    log "Building Docker images..."

    if [[ "$DRY_RUN" == true ]]; then
        log "[DRY RUN] Would build Docker images"
        return
    fi

    # Build with BuildKit for better caching
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1

    # Build all services
    docker-compose build --parallel

    success "Docker images built successfully"
}

# Health check before deployment
pre_deployment_health_check() {
    if [[ "$FORCE_DEPLOY" == true ]]; then
        warning "Skipping pre-deployment health check (--force flag used)"
        return
    fi

    log "Running pre-deployment health check..."

    # Check if services are currently running
    if docker-compose ps | grep -q "Up"; then
        log "Checking current deployment health..."

        # Check client health
        if ! curl -sf http://localhost:3000/health >/dev/null 2>&1; then
            warning "Client health check failed"
        fi

        # Check server health
        if ! curl -sf http://localhost:5000/api/monitoring/health >/dev/null 2>&1; then
            warning "Server health check failed"
        fi

        # Check AI service health
        if ! curl -sf http://localhost:8000/health >/dev/null 2>&1; then
            warning "AI service health check failed"
        fi
    fi

    success "Pre-deployment health check completed"
}

# Deploy services
deploy_services() {
    log "Deploying services..."

    if [[ "$DRY_RUN" == true ]]; then
        log "[DRY RUN] Would deploy services with:"
        log "  - Environment: $ENVIRONMENT"
        log "  - Configuration: .env.$ENVIRONMENT"
        return
    fi

    # Set environment file
    export ENV_FILE=".env.$ENVIRONMENT"

    # Deploy with rolling update strategy
    log "Starting rolling deployment..."

    # Deploy AI service first (least critical)
    docker-compose up -d ai-service
    sleep 10

    # Deploy server
    docker-compose up -d server
    sleep 15

    # Deploy client last
    docker-compose up -d client

    success "Services deployed successfully"
}

# Post-deployment health check
post_deployment_health_check() {
    log "Running post-deployment health check..."

    max_attempts=30
    attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts..."

        # Check all services
        client_healthy=false
        server_healthy=false
        ai_healthy=false

        # Check client
        if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
            client_healthy=true
        fi

        # Check server
        if curl -sf http://localhost:5000/api/monitoring/health >/dev/null 2>&1; then
            server_healthy=true
        fi

        # Check AI service
        if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
            ai_healthy=true
        fi

        if [[ "$client_healthy" == true && "$server_healthy" == true && "$ai_healthy" == true ]]; then
            success "All services are healthy"
            return
        fi

        log "Waiting for services to be ready... (${attempt}/${max_attempts})"
        sleep 10
        ((attempt++))
    done

    error "Health check failed after $max_attempts attempts"
}

# Cleanup old resources
cleanup() {
    log "Cleaning up old resources..."

    if [[ "$DRY_RUN" == true ]]; then
        log "[DRY RUN] Would clean up old Docker images and volumes"
        return
    fi

    # Remove dangling images
    docker image prune -f

    # Remove old backups (keep last 5)
    if [[ -d "$BACKUP_DIR" ]]; then
        cd "$BACKUP_DIR"
        ls -t backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
    fi

    success "Cleanup completed"
}

# Rollback function
rollback() {
    error_msg="$1"
    error "Deployment failed: $error_msg"

    log "Starting rollback procedure..."

    # Find latest backup
    latest_backup=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -n 1)

    if [[ -n "$latest_backup" ]]; then
        log "Rolling back to: $latest_backup"

        # Extract and restore
        cd "$BACKUP_DIR"
        backup_name=$(basename "$latest_backup" .tar.gz)
        tar -xzf "$latest_backup"

        if [[ -f "$backup_name/restore.sh" ]]; then
            bash "$backup_name/restore.sh"
            log "Rollback completed"
        else
            error "Rollback script not found in backup"
        fi
    else
        error "No backup found for rollback"
    fi
}

# Main deployment function
main() {
    trap 'rollback "Script interrupted"' INT TERM

    cd "$PROJECT_ROOT"

    log "=== Literati Deployment Started ==="
    log "Environment: $ENVIRONMENT"
    log "Timestamp: $TIMESTAMP"
    log "Dry Run: $DRY_RUN"

    # Execute deployment steps
    check_prerequisites
    run_tests
    create_backup
    build_images
    pre_deployment_health_check
    deploy_services
    post_deployment_health_check
    cleanup

    success "=== Deployment Completed Successfully ==="
    log "Deployment ID: deploy_$TIMESTAMP"
    log "Log file: $LOG_FILE"

    if [[ "$DRY_RUN" == false ]]; then
        log "Services are now running:"
        docker-compose ps

        log ""
        log "Access URLs:"
        log "  Client: http://localhost:3000"
        log "  Server: http://localhost:5000"
        log "  AI Service: http://localhost:8000"
        log "  Health Check: http://localhost:5000/api/monitoring/health"
        log "  Monitoring: http://localhost:5000/api/monitoring/dashboard"
    fi
}

# Run main function
main "$@"