import os
import random
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    # Temporarily comment out SQLAlchemy integration due to import issue
    # from sentry_sdk.integrations.sqlalchemy import SqlAlchemyIntegration
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False
    print("[Sentry] Warning: sentry-sdk not installed. Error reporting will be disabled.")

SENTRY_CONFIG = {
    "development": {
        "dsn": None,  # Disable Sentry in development
        "enabled": False
    },
    "staging": {
        "dsn": os.getenv("SENTRY_DSN"),
        "enabled": True,
        "environment": "staging"
    },
    "production": {
        "dsn": os.getenv("SENTRY_DSN"),
        "enabled": True,
        "environment": "production"
    }
}

def initialize_sentry():
    """Initialize Sentry for the AI service."""
    if not SENTRY_AVAILABLE:
        print("[Sentry] Not available - skipping initialization")
        return
        
    environment = os.getenv("ENVIRONMENT", "development")
    config = SENTRY_CONFIG.get(environment, SENTRY_CONFIG["development"])

    if not config["enabled"] or not config["dsn"]:
        print(f"[Sentry] Disabled for environment: {environment}")
        return

    sentry_sdk.init(
        dsn=config["dsn"],
        environment=config["environment"],
        integrations=[
            # FastAPI integration for web requests
            FastApiIntegration(auto_enable=True),
            # SQLAlchemy integration if using database (temporarily disabled)
            # SqlAlchemyIntegration(),
        ],
        # Performance monitoring
        traces_sample_rate=0.1 if environment == "production" else 1.0,

        # Profiling for performance insights
        profiles_sample_rate=0.01 if environment == "production" else 0.1,

        # Release tracking
        release=os.getenv("APP_VERSION", "unknown"),

        # Server configuration
        server_name=os.getenv("SERVER_NAME", "shelfquest-ai"),

        # Error filtering
        before_send=filter_events,

        # Performance transaction filtering
        before_send_transaction=filter_transactions,
    )

    # Set service context
    sentry_sdk.set_user({
        "id": "ai-service",
        "environment": config["environment"]
    })

    # Set service tags
    sentry_sdk.set_tag("service", "literati-ai")
    sentry_sdk.set_tag("version", os.getenv("APP_VERSION", "unknown"))

    print(f"[Sentry] Initialized for environment: {environment}")

def filter_events(event, hint):
    """Filter out non-critical events."""
    # Don't log events in development
    if os.getenv("ENVIRONMENT", "development") == "development":
        return None

    # Filter out common non-critical errors
    if event.get("exception"):
        exception_value = hint.get("exc_info", [None, None, None])[1]
        if exception_value:
            # Filter out validation errors (they're handled properly)
            if isinstance(exception_value, ValueError):
                return None

            # Filter out connection timeouts (external API issues)
            if "timeout" in str(exception_value).lower():
                return None

    return event

def filter_transactions(event, hint):
    """Filter performance transactions."""
    # Sample health check requests less frequently
    if event.get("transaction") and "health" in event.get("transaction", "").lower():
        if event.get("contexts", {}).get("trace", {}).get("sampled"):
            # 1% sampling for health checks
            event["contexts"]["trace"]["sampled"] = random.random() < 0.01

    return event

def report_error(error, context=None):
    """Manually report an error to Sentry."""
    if not SENTRY_AVAILABLE:
        return
        
    if context is None:
        context = {}

    sentry_sdk.capture_exception(
        error,
        tags={
            "section": "manual-report",
            **context.get("tags", {})
        },
        extra=context,
        user=context.get("user")
    )

def add_breadcrumb(message, category="ai-processing", level="info", data=None):
    """Add a breadcrumb to Sentry."""
    if not SENTRY_AVAILABLE:
        return
        
    if data is None:
        data = {}

    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        level=level,
        data=data,
    )

def start_transaction(name, operation="ai.processing"):
    """Start a performance transaction."""
    if not SENTRY_AVAILABLE:
        return None
        
    return sentry_sdk.start_transaction(
        name=name,
        op=operation
    )

def with_sentry_transaction(name, operation="ai.processing"):
    """Decorator to wrap functions with Sentry transaction monitoring."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            if not SENTRY_AVAILABLE:
                return func(*args, **kwargs)
                
            transaction = sentry_sdk.start_transaction(
                name=name,
                op=operation
            )

            try:
                result = func(*args, **kwargs)
                transaction.set_status("ok")
                return result
            except Exception as error:
                transaction.set_status("internal_error")
                sentry_sdk.capture_exception(error)
                raise
            finally:
                transaction.finish()

        return wrapper
    return decorator

# Context manager for transaction monitoring
class SentryTransaction:
    """Context manager for Sentry transaction monitoring."""

    def __init__(self, name, operation="ai.processing"):
        self.name = name
        self.operation = operation
        self.transaction = None

    def __enter__(self):
        if SENTRY_AVAILABLE:
            self.transaction = sentry_sdk.start_transaction(
                name=self.name,
                op=self.operation
            )
        return self.transaction

    def __exit__(self, exc_type, exc_val, exc_tb):
        if not SENTRY_AVAILABLE or not self.transaction:
            return
            
        if exc_type:
            self.transaction.set_status("internal_error")
            sentry_sdk.capture_exception(exc_val)
        else:
            self.transaction.set_status("ok")

        self.transaction.finish()