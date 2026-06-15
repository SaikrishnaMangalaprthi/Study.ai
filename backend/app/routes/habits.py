from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Habit, User, HabitCheckIn,Notification
from datetime import datetime, date as dt_date, timedelta

bp = Blueprint('habits', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

def _update_streaks(habit):
    # Get all check-ins completed=True in descending date order
    checkins = habit.check_ins.filter_by(completed=True).order_by(HabitCheckIn.date.desc()).all()
    if not checkins:
        habit.streak = 0
        db.session.commit()
        return

    dates = {c.date for c in checkins}
    latest_checkin = checkins[0].date
    current_date = dt_date.today()

    # If the latest check-in is older than yesterday, streak is broken
    if latest_checkin < current_date - timedelta(days=1):
        habit.streak = 0
    else:
        # Trace backwards from latest checkin
        streak = 0
        check_ptr = latest_checkin
        while check_ptr in dates:
            streak += 1
            check_ptr -= timedelta(days=1)
        habit.streak = streak

    if habit.streak > habit.longest_streak:
        habit.longest_streak = habit.streak
    db.session.commit()

@bp.route('/', methods=['GET'])
@jwt_required()
def list_habits():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    habits = Habit.query.filter_by(user_id=user.id).all()
    
    # Calculate global/individual analytics for weekly/monthly completion
    # We will send completion percentages
    res = []
    for h in habits:
        checkins = h.check_ins.all()
        history = [c.date.isoformat() for c in checkins if c.completed]
        
        # Calculate completion over last 30 days
        last_30_days = [dt_date.today() - timedelta(days=i) for i in range(30)]
        completed_last_30 = h.check_ins.filter(
            HabitCheckIn.date.in_(last_30_days), 
            HabitCheckIn.completed == True
        ).count()
        completion_rate = round((completed_last_30 / 30.0) * 100)
        
        res.append({
            'id': h.id,
            'name': h.name,
            'streak': h.streak,
            'longest_streak': h.longest_streak,
            'target_percentage': h.target_percentage,
            'last_checked_in': h.last_checked_in.isoformat() if h.last_checked_in else None,
            'history': history,
            'completion_rate_30': completion_rate
        })
    return jsonify(res), 200

@bp.route('/', methods=['POST'])
@jwt_required()
def create_habit():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    data = request.get_json()
    habit = Habit(
        name=data.get('name'),
        streak=0,
        longest_streak=0,
        target_percentage=data.get('target_percentage', 0),
        user_id=user.id,
    )
    db.session.add(habit)
    db.session.commit()
    return jsonify({'msg': 'Habit created', 'id': habit.id}), 201

@bp.route('/<int:habit_id>', methods=['PUT'])
@jwt_required()
def update_habit(habit_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    habit = Habit.query.filter_by(id=habit_id, user_id=user.id).first_or_404()
    data = request.get_json()
    for field in ['name', 'target_percentage']:
        if field in data:
            setattr(habit, field, data[field])
    db.session.commit()
    return jsonify({'msg': 'Habit updated'}), 200

@bp.route('/<int:habit_id>', methods=['DELETE'])
@jwt_required()
def delete_habit(habit_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    habit = Habit.query.filter_by(id=habit_id, user_id=user.id).first_or_404()
    db.session.delete(habit)
    db.session.commit()
    return jsonify({'msg': 'Habit deleted'}), 200

# Daily Check-in route
@bp.route('/<int:habit_id>/checkin', methods=['POST'])
@jwt_required()
def checkin_habit(habit_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    habit = Habit.query.filter_by(id=habit_id, user_id=user.id).first_or_404()
    data = request.get_json() or {}
    
    # Parse check-in date
    date_str = data.get('date')
    if date_str:
        try:
            checkin_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except Exception:
            return jsonify({'msg': 'Invalid date format'}), 400
    else:
        checkin_date = dt_date.today()
        
    completed = data.get('completed', True)
    
    # Update or insert check-in record
    checkin = HabitCheckIn.query.filter_by(habit_id=habit.id, date=checkin_date).first()
    if checkin:
        checkin.completed = completed
    else:
        checkin = HabitCheckIn(habit_id=habit.id, date=checkin_date, completed=completed)
        db.session.add(checkin)
        
    if completed:
        habit.last_checked_in = checkin_date
        
    db.session.commit()
    _update_streaks(habit)
    
    # Award XP if completed
    if completed:
        user.xp_points += 10
        if user.xp_points >= user.level * 100:
            user.xp_points -= user.level * 100
            user.level += 1
            # Add congratulatory notification
            notif = Notification(
                title="Level Up! 🎉",
                message=f"Congratulations! You reached level {user.level} by building healthy habits.",
                category="System",
                user_id=user.id
            )
            db.session.add(notif)
        db.session.commit()
        
    return jsonify({
        'msg': 'Check-in recorded',
        'streak': habit.streak,
        'longest_streak': habit.longest_streak,
        'xp': user.xp_points,
        'level': user.level
    }), 200
