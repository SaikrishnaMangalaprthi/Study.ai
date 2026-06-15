from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, User, Task, Goal, Habit, Score, StudySession, PomodoroSession, HabitCheckIn
from datetime import datetime, date as dt_date, timedelta

bp = Blueprint('analytics', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

@bp.route('/summary', methods=['GET'])
@jwt_required()
def get_analytics_summary():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    days = request.args.get('days', default=7, type=int)
    today = dt_date.today()
    start_date = today - timedelta(days=days - 1)
    
    # 1. Study Hours Trend (General Sessions + Pomodoros)
    study_hours_by_day = {}
    for i in range(days):
        d = start_date + timedelta(days=i)
        study_hours_by_day[d.isoformat()] = 0.0
        
    # Get study sessions in range
    sessions = StudySession.query.filter(
        StudySession.user_id == user.id,
        StudySession.start_time >= datetime.combine(start_date, datetime.min.time())
    ).all()
    
    for s in sessions:
        if s.start_time and s.end_time:
            s_date = s.start_time.date().isoformat()
            if s_date in study_hours_by_day:
                study_hours_by_day[s_date] += (s.end_time - s.start_time).total_seconds() / 3600.0
                
    # Get pomodoros in range
    pomodoros = PomodoroSession.query.filter(
        PomodoroSession.user_id == user.id,
        PomodoroSession.created_at >= datetime.combine(start_date, datetime.min.time()),
        PomodoroSession.completed == True
    ).all()
    
    for p in pomodoros:
        p_date = p.created_at.date().isoformat()
        if p_date in study_hours_by_day:
            study_hours_by_day[p_date] += p.duration / 60.0
            
    # Round hours
    for k in study_hours_by_day:
        study_hours_by_day[k] = round(study_hours_by_day[k], 1)
        
    # 2. Task Completion Chart (Count by status)
    tasks = Task.query.filter_by(user_id=user.id).all()
    task_stats = {
        'total': len(tasks),
        'completed': sum(1 for t in tasks if t.status == 'Completed'),
        'in_progress': sum(1 for t in tasks if t.status == 'In Progress'),
        'pending': sum(1 for t in tasks if t.status == 'Pending'),
        'high_priority': sum(1 for t in tasks if t.priority == 'High'),
        'medium_priority': sum(1 for t in tasks if t.priority == 'Medium'),
        'low_priority': sum(1 for t in tasks if t.priority == 'Low')
    }
    
    # 3. Subject Performance Chart (Avg Score % by Subject)
    scores = Score.query.filter_by(user_id=user.id).all()
    subject_scores = {}
    for s in scores:
        if not s.subject:
            continue
        sub = s.subject.strip()
        if sub not in subject_scores:
            subject_scores[sub] = []
        pct = (s.obtained / s.total) * 100 if s.total else 0
        subject_scores[sub].append(pct)
        
    subject_performance = []
    weak_subjects = []
    for sub, pct_list in subject_scores.items():
        avg = round(sum(pct_list) / len(pct_list), 1)
        subject_performance.append({'subject': sub, 'avg_score': avg})
        if avg < 65.0:
            weak_subjects.append({'subject': sub, 'avg_score': avg})
            
    # Sort weak subjects ascending (weakest first)
    weak_subjects.sort(key=lambda x: x['avg_score'])
    
    # 4. Habit Consistency Chart
    habits = Habit.query.filter_by(user_id=user.id).all()
    habit_consistency = []
    total_habits = len(habits)
    
    habit_dates = {}
    for i in range(days):
        d = start_date + timedelta(days=i)
        habit_dates[d.isoformat()] = 0
        
    if total_habits > 0:
        checkins = HabitCheckIn.query.join(Habit).filter(
            Habit.user_id == user.id,
            HabitCheckIn.completed == True,
            HabitCheckIn.date >= start_date
        ).all()
        for c in checkins:
            c_date = c.date.isoformat()
            if c_date in habit_dates:
                habit_dates[c_date] += 1
                
        for date_str, count in habit_dates.items():
            pct = round((count / total_habits) * 100)
            # Add week_label and percent aliases for seamless Dashboard rendering
            day_short = datetime.strptime(date_str, '%Y-%m-%d').strftime('%a')
            habit_consistency.append({
                'date': date_str, 
                'week_label': day_short,
                'percentage': pct,
                'percent': pct
            })
    else:
        for date_str in habit_dates:
            day_short = datetime.strptime(date_str, '%Y-%m-%d').strftime('%a')
            habit_consistency.append({
                'date': date_str, 
                'week_label': day_short,
                'percentage': 0,
                'percent': 0
            })
            
    # 5. Productivity score
    task_comp_rate = (task_stats['completed'] / max(task_stats['total'], 1)) * 100
    avg_study_hours = sum(study_hours_by_day.values()) / max(days, 1)
    study_target_rate = min((avg_study_hours / 2.0) * 100, 100) # 2 hours daily focus target
    
    avg_habit_rate = sum(h['percentage'] for h in habit_consistency) / max(len(habit_consistency), 1)
    
    productivity_score = round(
        (task_comp_rate * 0.4) + 
        (study_target_rate * 0.4) + 
        (avg_habit_rate * 0.2)
    )
    
    # Format study_hours_trend to include 'day_short' label mapping
    formatted_study_hours = [
        {
            'date': k, 
            'day_short': datetime.strptime(k, '%Y-%m-%d').strftime('%a'), 
            'hours': v
        } 
        for k, v in study_hours_by_day.items()
    ]
    
    return jsonify({
        'productivity_score': productivity_score,
        'study_hours_trend': formatted_study_hours,
        'task_stats': task_stats,
        'subject_performance': subject_performance,
        'habit_consistency': habit_consistency,
        'weak_subjects': weak_subjects,
        'xp_total': user.xp_points,
        'today_study_hours': round(study_hours_by_day.get(today.isoformat(), 0.0), 1),
        'focus_summary': {
            'total_study_hours': round(sum(study_hours_by_day.values()), 1),
            'avg_daily_hours': round(avg_study_hours, 1),
            'pomodoros_completed': len(pomodoros)
        }
    }), 200