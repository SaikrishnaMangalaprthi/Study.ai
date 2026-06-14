from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, User, Achievement, UserAchievement, Task, Goal, Habit, StudySession, PomodoroSession, Notification, utc_now

bp = Blueprint('achievements', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

# Helper to seed achievements in database if empty
def _seed_achievements():
    if Achievement.query.first() is not None:
        return
        
    badges = [
        ("7-Day Streak", "Complete a habit 7 days in a row.", "🔥", 100),
        ("30-Day Streak", "Complete a habit 30 days in a row.", "👑", 300),
        ("Task Master", "Complete 20 study tasks.", "📝", 150),
        ("Goal Crusher", "Achieve at least one major goal.", "🎯", 200),
        ("Study Champion", "Accumulate 10 total study hours.", "📚", 250),
        ("100 Study Hours", "Accumulate 100 total study hours.", "🏆", 500),
    ]
    for title, desc, icon, xp in badges:
        ach = Achievement(title=title, description=desc, icon=icon, xp_reward=xp)
        db.session.add(ach)
    db.session.commit()

def _check_and_unlock_achievements(user):
    _seed_achievements()
    
    # Unlocked achievements set
    unlocked_ids = {ua.achievement_id for ua in user.user_achievements}
    
    # 1. Fetch stats
    # Task completion
    tasks_completed = Task.query.filter_by(user_id=user.id, status='Completed').count()
    
    # Goal completion
    goals_completed = Goal.query.join(Goal.owners).filter(User.id == user.id, Goal.status == 'Completed').count()
    
    # Habit longest streak
    longest_streak = 0
    habits = Habit.query.filter_by(user_id=user.id).all()
    if habits:
        longest_streak = max([h.longest_streak for h in habits] + [0])
        
    # Total focus hours
    pomodoro_minutes = db.session.query(db.func.sum(PomodoroSession.duration)).filter(
        PomodoroSession.user_id == user.id, 
        PomodoroSession.completed == True
    ).scalar() or 0
    
    study_session_seconds = 0
    sessions = StudySession.query.filter_by(user_id=user.id).all()
    for s in sessions:
        if s.start_time and s.end_time:
            study_session_seconds += (s.end_time - s.start_time).total_seconds()
            
    total_study_hours = (pomodoro_minutes / 60.0) + (study_session_seconds / 3600.0)
    
    # Map badges to criteria
    # Badges:
    # 1: 7-Day Streak
    # 2: 30-Day Streak
    # 3: Task Master
    # 4: Goal Crusher
    # 5: Study Champion
    # 6: 100 Study Hours
    
    achievements = Achievement.query.all()
    
    new_unlocks = []
    
    for ach in achievements:
        if ach.id in unlocked_ids:
            continue
            
        unlocked = False
        if ach.title == "7-Day Streak" and longest_streak >= 7:
            unlocked = True
        elif ach.title == "30-Day Streak" and longest_streak >= 30:
            unlocked = True
        elif ach.title == "Task Master" and tasks_completed >= 20:
            unlocked = True
        elif ach.title == "Goal Crusher" and goals_completed >= 1:
            unlocked = True
        elif ach.title == "Study Champion" and total_study_hours >= 10.0:
            unlocked = True
        elif ach.title == "100 Study Hours" and total_study_hours >= 100.0:
            unlocked = True
            
        if unlocked:
            ua = UserAchievement(user_id=user.id, achievement_id=ach.id, earned_at=utc_now())
            db.session.add(ua)
            new_unlocks.append(ach)
            
            # Award XP
            user.xp_points += ach.xp_reward
            if user.xp_points >= user.level * 100:
                user.xp_points -= user.level * 100
                user.level += 1
                
            # Create system notification
            notif = Notification(
                title=f"Badge Unlocked: {ach.title}! {ach.icon}",
                message=f"You earned the '{ach.title}' badge and {ach.xp_reward} XP! {ach.description}",
                category="Achievement",
                user_id=user.id
            )
            db.session.add(notif)
            
    if new_unlocks:
        db.session.commit()
        
    return new_unlocks

@bp.route('/', methods=['GET'])
@jwt_required()
def list_achievements():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    _check_and_unlock_achievements(user)
    
    unlocked = {ua.achievement_id: ua.earned_at for ua in user.user_achievements}
    all_ach = Achievement.query.all()
    
    res = []
    for ach in all_ach:
        is_earned = ach.id in unlocked
        res.append({
            'id': ach.id,
            'title': ach.title,
            'description': ach.description,
            'icon': ach.icon,
            'xp_reward': ach.xp_reward,
            'earned': is_earned,
            'earned_at': unlocked[ach.id].isoformat() if is_earned else None
        })
        
    return jsonify({
        'achievements': res,
        'level': user.level,
        'xp': user.xp_points,
        'next_level_xp': user.level * 100
    }), 200
