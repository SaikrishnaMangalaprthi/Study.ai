from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, User, Task, Exam, Score, PomodoroSession, StudySession
from datetime import datetime, date as dt_date, timedelta

bp = Blueprint('ai_planner', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

@bp.route('/recommendations', methods=['GET'])
@jwt_required()
def get_ai_recommendations():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    today = dt_date.today()
    
    # 1. Fetch user data
    pending_tasks = Task.query.filter_by(user_id=user.id, status='Pending').all()
    upcoming_exams = Exam.query.filter(
        Exam.user_id == user.id, 
        Exam.exam_date >= today,
        Exam.status == 'Upcoming'
    ).order_by(Exam.exam_date.asc()).all()
    
    scores = Score.query.filter_by(user_id=user.id).all()
    
    # Calculate subject focus minutes
    subject_focus = {}
    pomodoros = PomodoroSession.query.filter_by(user_id=user.id, completed=True).all()
    for p in pomodoros:
        sub = p.subject_rel.name if p.subject_rel else "General"
        subject_focus[sub] = subject_focus.get(sub, 0) + p.duration
        
    sessions = StudySession.query.filter_by(user_id=user.id).all()
    for s in sessions:
        if s.start_time and s.end_time:
            sub = s.subject_rel.name if s.subject_rel else "General"
            mins = (s.end_time - s.start_time).total_seconds() / 60.0
            subject_focus[sub] = subject_focus.get(sub, 0) + mins
            
    # Calculate average marks per subject to find weak subjects
    sub_scores = {}
    for sc in scores:
        if sc.subject:
            sub = sc.subject.strip()
            if sub not in sub_scores:
                sub_scores[sub] = []
            sub_scores[sub].append((sc.obtained / sc.total) * 100 if sc.total else 0)
            
    weak_subjects = []
    for sub, vals in sub_scores.items():
        avg = sum(vals) / len(vals)
        if avg < 65:
            weak_subjects.append(sub)
            
    # 2. Heuristic Engine
    recommendations = []
    daily_slots = []
    workload_balance = "Balanced"
    
    # Workload balance check
    total_items = len(pending_tasks) + len(upcoming_exams)
    if total_items > 8:
        workload_balance = "Heavy"
    elif total_items <= 2:
        workload_balance = "Light"
        
    # Recommendations & Schedule generation
    # Priority 1: Exams within 7 days
    exam_imminent = False
    for ex in upcoming_exams:
        days_left = (ex.exam_date - today).days
        sub_name = ex.subject or "General"
        focus_mins = subject_focus.get(sub_name, 0)
        
        if days_left <= 7:
            exam_imminent = True
            if focus_mins < 120:
                recommendations.append({
                    'type': 'warning',
                    'title': f"Urgent Exam Prep: {ex.name}",
                    'desc': f"Your {sub_name} exam is in {days_left} days, but you have only focused on it for {round(focus_mins/60, 1)} hours. We suggest a 50-minute Pomodoro session today."
                })
            else:
                recommendations.append({
                    'type': 'info',
                    'title': f"Exam Coming Up: {ex.name}",
                    'desc': f"Your {sub_name} exam is in {days_left} days. Keep reviewing notes and practice past papers."
                })
                
    # Priority 2: Weak Subjects focus
    for ws in weak_subjects:
        if subject_focus.get(ws, 0) < 60:
            recommendations.append({
                'type': 'suggest',
                'title': f"Boost Weak Subject: {ws}",
                'desc': f"Your average score in {ws} is below 65%, and you have focused less than an hour this week. We recommend scheduling a dedicated revision slot."
            })
            
    # Priority 3: Overdue tasks
    overdue_count = 0
    for t in pending_tasks:
        if t.due_date and t.due_date < today:
            overdue_count += 1
    if overdue_count > 0:
        recommendations.append({
            'type': 'danger',
            'title': f"{overdue_count} Overdue Tasks Active",
            'desc': "Clear your overdue study tasks first to keep your dashboard clean and prevent study pile-ups."
        })
        
    # Default recommendations if clean
    if not recommendations:
        recommendations.append({
            'type': 'success',
            'title': "Workload Balanced! 👍",
            'desc': "No urgent exams or overdue tasks. Allocate 30 minutes to review any pinned/favorite notes, or start a general study Pomodoro."
        })
        
    # 3. Daily Schedule Generation (Heuristic 9AM - 5PM timeline)
    current_time = datetime.combine(today, datetime.min.time()) + timedelta(hours=9) # Start at 9:00 AM
    
    # Add tasks to schedule
    scheduled_tasks = sorted(pending_tasks, key=lambda x: (x.priority == 'High', x.due_date or today), reverse=True)
    
    slot_index = 0
    for t in scheduled_tasks[:3]: # Schedule top 3 tasks
        start_str = current_time.strftime("%I:%M %p")
        current_time += timedelta(minutes=45)
        end_str = current_time.strftime("%I:%M %p")
        
        sub_label = t.subject or "Study"
        daily_slots.append({
            'time': f"{start_str} - {end_str}",
            'activity': f"Focus Session: {t.title}",
            'subject': sub_label,
            'color': t.subject_rel.color if t.subject_rel else "#3b82f6"
        })
        
        # Add break slot
        start_break = current_time.strftime("%I:%M %p")
        current_time += timedelta(minutes=15)
        end_break = current_time.strftime("%I:%M %p")
        daily_slots.append({
            'time': f"{start_break} - {end_break}",
            'activity': "Short Break ☕",
            'subject': "Relax",
            'color': "#10b981"
        })
        
    # If exams are coming up, add a revision slot
    if upcoming_exams:
        ex = upcoming_exams[0]
        start_str = current_time.strftime("%I:%M %p")
        current_time += timedelta(minutes=60)
        end_str = current_time.strftime("%I:%M %p")
        daily_slots.append({
            'time': f"{start_str} - {end_str}",
            'activity': f"Revision: prep for {ex.name}",
            'subject': ex.subject or "Exam",
            'color': ex.subject_rel.color if ex.subject_rel else "#ec4899"
        })
        
    # Fallback to general study if slots empty
    if not daily_slots:
        daily_slots.append({
            'time': "09:00 AM - 10:00 AM",
            'activity': "General Focus Session (Pomodoro)",
            'subject': "Focus",
            'color': "#3b82f6"
        })
        daily_slots.append({
            'time': "10:00 AM - 10:15 AM",
            'activity': "Break 🍎",
            'subject': "Relax",
            'color': "#10b981"
        })
        
    return jsonify({
        'workload_balance': workload_balance,
        'recommendations': recommendations,
        'daily_schedule': daily_slots
    }), 200
