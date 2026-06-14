from flask import Blueprint
from .auth import bp as auth_bp
from .users import bp as users_bp
from .tasks import bp as tasks_bp
from .goals import bp as goals_bp
from .scores import bp as scores_bp
from .habits import bp as habits_bp
from .reminders import bp as reminders_bp
from .exams import bp as exams_bp
from .notes import bp as notes_bp
from .sessions import bp as sessions_bp
from .subjects import bp as subjects_bp
from .categories import bp as categories_bp
from .achievements import bp as achievements_bp
from .notifications import bp as notifications_bp
from .health import bp as health_bp
from .analytics import bp as analytics_bp
from .ai_planner import bp as ai_planner_bp

# Main API blueprint that aggregates all sub‑blueprints
api_bp = Blueprint('api', __name__)

# Register each sub‑blueprint with its own URL prefix
api_bp.register_blueprint(auth_bp, url_prefix='/auth')
api_bp.register_blueprint(users_bp, url_prefix='/users')
api_bp.register_blueprint(tasks_bp, url_prefix='/tasks')
api_bp.register_blueprint(goals_bp, url_prefix='/goals')
api_bp.register_blueprint(scores_bp, url_prefix='/scores')
api_bp.register_blueprint(habits_bp, url_prefix='/habits')
api_bp.register_blueprint(reminders_bp, url_prefix='/reminders')
api_bp.register_blueprint(exams_bp, url_prefix='/exams')
api_bp.register_blueprint(notes_bp, url_prefix='/notes')
api_bp.register_blueprint(sessions_bp, url_prefix='/sessions')
api_bp.register_blueprint(subjects_bp, url_prefix='/subjects')
api_bp.register_blueprint(categories_bp, url_prefix='/categories')
api_bp.register_blueprint(achievements_bp, url_prefix='/achievements')
api_bp.register_blueprint(notifications_bp, url_prefix='/notifications')
api_bp.register_blueprint(health_bp, url_prefix='/health')
api_bp.register_blueprint(analytics_bp, url_prefix='/analytics')
api_bp.register_blueprint(ai_planner_bp, url_prefix='/ai-planner')

