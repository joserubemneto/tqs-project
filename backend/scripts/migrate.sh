#!/bin/bash
# =============================================================================
# Database Migration Script
# Runs Flyway migrations independently of application deployment
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Default values
ACTION="${1:-info}"
DRY_RUN="${DRY_RUN:-false}"

# Required environment variables for production
check_env_vars() {
    local missing=()
    
    if [[ -z "${FLYWAY_URL:-}" ]]; then
        missing+=("FLYWAY_URL")
    fi
    if [[ -z "${FLYWAY_USER:-}" ]]; then
        missing+=("FLYWAY_USER")
    fi
    if [[ -z "${FLYWAY_PASSWORD:-}" ]]; then
        missing+=("FLYWAY_PASSWORD")
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        echo -e "${RED}Error: Missing required environment variables:${NC}"
        for var in "${missing[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Example:"
        echo "  export FLYWAY_URL='jdbc:postgresql://host:5432/dbname'"
        echo "  export FLYWAY_USER='username'"
        echo "  export FLYWAY_PASSWORD='password'"
        exit 1
    fi
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show usage
usage() {
    echo "Usage: $0 <action>"
    echo ""
    echo "Actions:"
    echo "  info       Show current migration status (default)"
    echo "  validate   Validate applied migrations against available ones"
    echo "  migrate    Run pending migrations"
    echo "  repair     Repair the Flyway schema history table"
    echo "  baseline   Baseline an existing database"
    echo "  undo       Undo the last applied migration (requires Flyway Teams)"
    echo "  clean      Drop all objects (DANGEROUS - disabled in production)"
    echo ""
    echo "Environment Variables:"
    echo "  FLYWAY_URL       JDBC URL (required)"
    echo "  FLYWAY_USER      Database username (required)"
    echo "  FLYWAY_PASSWORD  Database password (required)"
    echo "  DRY_RUN          Set to 'true' for dry-run mode"
    echo ""
    echo "Examples:"
    echo "  ./migrate.sh info"
    echo "  ./migrate.sh migrate"
    echo "  DRY_RUN=true ./migrate.sh migrate"
}

# Run Maven Flyway command
run_flyway() {
    local goal="$1"
    shift
    local extra_args=("$@")
    
    log_info "Running: mvn flyway:$goal ${extra_args[*]:-}"
    
    cd "$BACKEND_DIR"
    
    if [[ "$DRY_RUN" == "true" ]] && [[ "$goal" == "migrate" ]]; then
        log_warn "DRY RUN MODE - Migration will be validated but not applied"
        # In dry-run, we validate instead of migrate
        mvn flyway:validate -B "${extra_args[@]:-}"
    else
        mvn "flyway:$goal" -B "${extra_args[@]:-}"
    fi
}

# Main execution
main() {
    case "$ACTION" in
        info)
            check_env_vars
            log_info "Fetching migration status..."
            run_flyway info
            ;;
        
        validate)
            check_env_vars
            log_info "Validating migrations..."
            if run_flyway validate; then
                log_success "All migrations are valid!"
            else
                log_error "Migration validation failed!"
                exit 1
            fi
            ;;
        
        migrate)
            check_env_vars
            log_info "Running database migrations..."
            
            # First, validate
            log_info "Step 1/3: Validating migrations..."
            if ! run_flyway validate 2>/dev/null; then
                log_warn "Validation issues detected, proceeding with caution..."
            fi
            
            # Show what will be applied
            log_info "Step 2/3: Checking pending migrations..."
            run_flyway info | grep -E "(Pending|Current)" || true
            
            # Apply migrations
            log_info "Step 3/3: Applying migrations..."
            if run_flyway migrate; then
                log_success "Migrations completed successfully!"
                # Show final state
                run_flyway info
            else
                log_error "Migration failed!"
                exit 1
            fi
            ;;
        
        repair)
            check_env_vars
            log_warn "Repairing Flyway schema history table..."
            run_flyway repair
            log_success "Repair completed!"
            ;;
        
        baseline)
            check_env_vars
            log_info "Baselining existing database..."
            run_flyway baseline
            log_success "Baseline completed!"
            ;;
        
        undo)
            check_env_vars
            log_warn "Undo requires Flyway Teams edition"
            log_info "For manual rollback, use the undo scripts in db/migration/undo/"
            echo ""
            echo "To manually rollback V1, run:"
            echo "  psql \$DATABASE_URL -f src/main/resources/db/migration/undo/U1__undo_initial_schema.sql"
            ;;
        
        clean)
            check_env_vars
            log_error "DANGER: This will DROP all database objects!"
            log_error "This operation is disabled for safety."
            log_info "If you really need to clean the database, run manually:"
            echo "  mvn flyway:clean -Dflyway.cleanDisabled=false"
            exit 1
            ;;
        
        help|--help|-h)
            usage
            ;;
        
        *)
            log_error "Unknown action: $ACTION"
            echo ""
            usage
            exit 1
            ;;
    esac
}

main
