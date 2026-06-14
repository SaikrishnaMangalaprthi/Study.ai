import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()
cors = CORS()


def create_app():
    """Factory pattern for creating the Flask application.

    The configuration is loaded from the ``.env`` file (via ``python-dotenv``)
    and the required extensions are initialised. All blueprints are registered
    here so that the ``flask`` CLI can discover routes immediately.
    """
    # Load environment variables (SECRET_KEY, JWT_SECRET_KEY, DATABASE_URL, …)
    from dotenv import load_dotenv
    load_dotenv()

    app = Flask(__name__, instance_relative_config=True)
    os.makedirs(app.instance_path, exist_ok=True)

    # Basic configuration
    database_url = os.getenv("DATABASE_URL", "sqlite:///app.db")
    if database_url.startswith("sqlite:///"):
        db_path = database_url[len("sqlite:///") :]
        if not os.path.isabs(db_path):
            database_url = f"sqlite:///{os.path.join(app.instance_path, db_path)}"

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me-please")
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-change-me-please")

    # Initialise extensions with the app instance
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register all route blueprints under /api
    from .routes import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")

    # Health check
    from flask import jsonify
    @app.route("/health")
    def health():
        return jsonify(
            status="ok",
            db_url=app.config.get("SQLALCHEMY_DATABASE_URI"),
            db_file=db.engine.url.database,
        ), 200

    with app.app_context():
        if db.engine.url.drivername == "sqlite" and os.getenv("AUTO_CREATE_TABLES", "true").lower() == "true":
            db.create_all()

    return app


# Expose a ready-to-use app instance for the Flask CLI (e.g., ``flask run``)
app = create_app()
