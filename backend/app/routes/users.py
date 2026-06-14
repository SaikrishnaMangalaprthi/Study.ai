from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from ..models import db, User, Task, Goal, Habit, Score, StudySession, PomodoroSession
from datetime import datetime, date as dt_date, timedelta

bp = Blueprint('users', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile_data():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    # Compute user achievements & activities
    tasks_completed = Task.query.filter_by(user_id=user.id, status='Completed').count()
    goals_completed = Goal.query.join(Goal.owners).filter(User.id == user.id, Goal.status == 'Completed').count()
    
    # Calculate streak
    longest_streak = 0
    habits = Habit.query.filter_by(user_id=user.id).all()
    if habits:
        longest_streak = max([h.longest_streak for h in habits] + [0])
        
    # Focus hours
    pomodoro_minutes = db.session.query(db.func.sum(PomodoroSession.duration)).filter(
        PomodoroSession.user_id == user.id, 
        PomodoroSession.completed == True
    ).scalar() or 0
    
    study_seconds = 0
    sessions = StudySession.query.filter_by(user_id=user.id).all()
    for s in sessions:
        if s.start_time and s.end_time:
            study_seconds += (s.end_time - s.start_time).total_seconds()
            
    total_study_hours = round((pomodoro_minutes / 60.0) + (study_seconds / 3600.0), 1)
    
    # Recent activity log
    recent_sessions = StudySession.query.filter_by(user_id=user.id).order_by(StudySession.start_time.desc()).limit(5).all()
    recent_activity = []
    for rs in recent_sessions:
        if rs.start_time:
            duration = ""
            if rs.end_time:
                duration = f"for {round((rs.end_time - rs.start_time).total_seconds()/60)} mins"
            recent_activity.append({
                'title': f"Studied {rs.subject_rel.name if rs.subject_rel else 'General'}",
                'desc': f"{rs.focus_type} session {duration}",
                'time': rs.start_time.isoformat()
            })
            
    return jsonify({
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'avatar_url': user.avatar_url or '',
        'xp_points': user.xp_points,
        'level': user.level,
        'theme_color': user.theme_color or 'blue',
        'stats': {
            'tasks_completed': tasks_completed,
            'goals_completed': goals_completed,
            'study_hours': total_study_hours,
            'streak': longest_streak
        },
        'recent_activity': recent_activity,
        'achievements_count': user.user_achievements.count()
    }), 200

@bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    data = request.get_json() or {}
    
    if 'name' in data:
        user.name = data['name'].strip()
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
    if 'theme_color' in data:
        user.theme_color = data['theme_color']
    if 'notification_prefs' in data:
        user.notification_prefs = data['notification_prefs']
        
    db.session.commit()
    return jsonify({'msg': 'Settings updated', 'name': user.name, 'theme_color': user.theme_color}), 200

@bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    data = request.get_json() or {}
    
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not old_password or not new_password:
        return jsonify({'msg': 'Old and new passwords required'}), 400
        
    if not check_password_hash(user.password_hash, old_password):
        return jsonify({'msg': 'Incorrect old password'}), 401
        
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({'msg': 'Password updated successfully'}), 200
