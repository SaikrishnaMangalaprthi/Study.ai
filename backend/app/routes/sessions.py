from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, StudySession, PomodoroSession, User, Subject, Notification, utc_now
from datetime import date as dt_date, timedelta

bp = Blueprint('sessions', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

@bp.route('/', methods=['GET'])
@jwt_required()
def list_sessions():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    sessions = StudySession.query.filter_by(user_id=user.id).order_by(StudySession.start_time.desc()).all()
    return jsonify([{
        'id': s.id,
        'start_time': s.start_time.isoformat() if s.start_time else None,
        'end_time': s.end_time.isoformat() if s.end_time else None,
        'focus_type': s.focus_type,
        'subject_id': s.subject_id,
        'subject_name': s.subject_rel.name if s.subject_rel else None,
        'subject_color': s.subject_rel.color if s.subject_rel else None,
        'notes': s.notes or ''
    } for s in sessions]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
def start_session():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    data = request.get_json() or {}
    
    session = StudySession(
        start_time=utc_now(),
        focus_type=data.get('focus_type', 'Pomodoro'),
        subject_id=data.get('subject_id'),
        notes=data.get('notes', ''),
        user_id=user.id
    )
    db.session.add(session)
    db.session.commit()
    return jsonify({'msg': 'Session started', 'id': session.id}), 201

@bp.route('/<int:session_id>/end', methods=['PUT'])
@jwt_required()
def end_session(session_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    session = StudySession.query.filter_by(id=session_id, user_id=user.id).first_or_404()
    data = request.get_json() or {}
    
    session.end_time = utc_now()
    if 'notes' in data:
        session.notes = data['notes']
        
    db.session.commit()
    
    # Initialize xp_gain to safely expose it outside the if-scope block
    xp_gain = 0
    
    # Calculate duration in minutes and award XP
    if session.start_time and session.end_time:
        duration_minutes = (session.end_time - session.start_time).total_seconds() / 60.0
        xp_gain = int(duration_minutes * 0.5) # 0.5 XP per focus minute
        if xp_gain > 0:
            user.xp_points += xp_gain
            if user.xp_points >= user.level * 100:
                user.xp_points -= user.level * 100
                user.level += 1
                notif = Notification(
                    title="Level Up! 🎉",
                    message=f"You levelled up to {user.level} by finishing study sessions!",
                    category="System",
                    user_id=user.id
                )
                db.session.add(notif)
            db.session.commit()
            
    return jsonify({'msg': 'Session ended', 'xp_earned': xp_gain}), 200


@bp.route('/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    session = StudySession.query.filter_by(id=session_id, user_id=user.id).first_or_404()
    db.session.delete(session)
    db.session.commit()
    return jsonify({'msg': 'Session deleted'}), 200

# Pomodoro Sessions CRUD
@bp.route('/pomodoro', methods=['GET'])
@jwt_required()
def list_pomodoros():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    pomodoros = PomodoroSession.query.filter_by(user_id=user.id).order_by(PomodoroSession.created_at.desc()).all()
    return jsonify([{
        'id': p.id,
        'duration': p.duration,
        'break_time': p.break_time,
        'completed': p.completed,
        'created_at': p.created_at.isoformat(),
        'subject_id': p.subject_id,
        'subject_name': p.subject_rel.name if p.subject_rel else None,
        'subject_color': p.subject_rel.color if p.subject_rel else None
    } for p in pomodoros]), 200

@bp.route('/pomodoro', methods=['POST'])
@jwt_required()
def save_pomodoro():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    data = request.get_json()
    p = PomodoroSession(
        duration=data.get('duration', 25),
        break_time=data.get('break_time', 5),
        completed=data.get('completed', True),
        subject_id=data.get('subject_id'),
        user_id=user.id
    )
    db.session.add(p)
    
    # Award 15 XP for completed Pomodoro cycle
    xp_earned = 0
    if p.completed:
        xp_earned = 15
        user.xp_points += xp_earned
        if user.xp_points >= user.level * 100:
            user.xp_points -= user.level * 100
            user.level += 1
            notif = Notification(
                title="Level Up! 🎉",
                message=f"You reached level {user.level} by completing Pomodoro sessions!",
                category="System",
                user_id=user.id
            )
            db.session.add(notif)
            
    db.session.commit()
    return jsonify({'msg': 'Pomodoro session saved', 'id': p.id, 'xp_earned': xp_earned}), 201

# Analytics summary helper
@bp.route('/stats', methods=['GET'])
@jwt_required()
def focus_stats():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    today = dt_date.today()
    # Convert today's date into a valid full datetime timestamp for exact database column parsing
    today_start = datetime.combine(today, datetime.min.time())
    
    # General session hours
    sessions_today = StudySession.query.filter(
        StudySession.user_id == user.id,
        StudySession.start_time >= today_start
    ).all()
    
    study_hours_today = 0.0
    for s in sessions_today:
        if s.start_time and s.end_time:
            study_hours_today += (s.end_time - s.start_time).total_seconds() / 3600.0
            
    # Pomodoro session hours
    pomodoros_today = PomodoroSession.query.filter(
        PomodoroSession.user_id == user.id,
        PomodoroSession.created_at >= today_start,
        PomodoroSession.completed == True
    ).all()
    study_hours_today += sum(p.duration for p in pomodoros_today) / 60.0
    
    return jsonify({
        'study_hours_today': round(study_hours_today, 1),
    }), 200

    