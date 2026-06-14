from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Task, User, Notification
from datetime import datetime, date as dt_date, timedelta

bp = Blueprint('tasks', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

def _handle_recurrence(task):
    if not task.recurrence or task.recurrence == "None":
        return
        
    days = 0
    if task.recurrence == "Daily":
        days = 1
    elif task.recurrence == "Weekly":
        days = 7
    elif task.recurrence == "Monthly":
        days = 30
        
    next_due = None
    if task.due_date:
        next_due = task.due_date + timedelta(days=days)
    else:
        next_due = dt_date.today() + timedelta(days=days)
        
    next_task = Task(
        title=task.title,
        description=task.description,
        priority=task.priority,
        subject=task.subject,
        due_date=next_due,
        status="Pending",
        recurrence=task.recurrence,
        user_id=task.user_id,
        subject_id=task.subject_id,
        category_id=task.category_id,
        parent_id=task.parent_id
    )
    db.session.add(next_task)

@bp.route('/', methods=['GET'])
@jwt_required()
def list_tasks():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    query = Task.query.filter_by(user_id=user.id)
    
    # Apply filters
    search = request.args.get('search')
    if search:
        query = query.filter((Task.title.like(f'%{search}%')) | (Task.description.like(f'%{search}%')))
        
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
        
    priority = request.args.get('priority')
    if priority:
        query = query.filter_by(priority=priority)
        
    subject_id = request.args.get('subject_id')
    if subject_id:
        query = query.filter_by(subject_id=int(subject_id))
        
    category_id = request.args.get('category_id')
    if category_id:
        query = query.filter_by(category_id=int(category_id))
        
    # Exclude subtasks from main list if root_only is set
    root_only = request.args.get('root_only', 'false').lower() == 'true'
    if root_only:
        query = query.filter(Task.parent_id.is_(None))

    # Sorting
    sort_by = request.args.get('sort_by', 'due_date') # due_date, priority
    sort_dir = request.args.get('sort_dir', 'asc') # asc, desc
    
    if sort_by == 'priority':
        # Custom priority sorting: High first, then Medium, then Low
        # We can map enum values or use simple ordering
        if sort_dir == 'desc':
            query = query.order_by(Task.priority.desc())
        else:
            query = query.order_by(Task.priority.asc())
    else:
        # Default sort by due date
        if sort_dir == 'desc':
            query = query.order_by(Task.due_date.desc().nullslast())
        else:
            query = query.order_by(Task.due_date.asc().nullslast())
            
    tasks = query.all()
    
    return jsonify([{
        'id': t.id,
        'title': t.title,
        'description': t.description,
        'priority': t.priority,
        'subject': t.subject,
        'due_date': t.due_date.isoformat() if t.due_date else None,
        'status': t.status,
        'recurrence': t.recurrence,
        'parent_id': t.parent_id,
        'progress_pct': t.progress_pct,
        'subject_id': t.subject_id,
        'subject_color': t.subject_rel.color if t.subject_rel else None,
        'category_id': t.category_id,
        'category_name': t.category_rel.name if t.category_rel else None,
        'subtasks': [{
            'id': sub.id,
            'title': sub.title,
            'status': sub.status,
            'priority': sub.priority,
            'due_date': sub.due_date.isoformat() if sub.due_date else None,
        } for sub in t.subtasks.all()]
    } for t in tasks]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    data = request.get_json()
    due_date = None
    if data.get('due_date'):
        try:
            due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        except Exception:
            pass
            
    task = Task(
        title=data.get('title'),
        description=data.get('description', ''),
        priority=data.get('priority', 'Medium'),
        subject=data.get('subject', ''),
        due_date=due_date,
        status=data.get('status', 'Pending'),
        recurrence=data.get('recurrence', 'None'),
        parent_id=data.get('parent_id') if data.get('parent_id') else None,
        progress_pct=data.get('progress_pct', 0),
        subject_id=data.get('subject_id') if data.get('subject_id') else None,
        category_id=data.get('category_id') if data.get('category_id') else None,
        user_id=user.id,
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'msg': 'Task created', 'id': task.id}), 201

@bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    task = Task.query.filter_by(id=task_id, user_id=user.id).first_or_404()
    data = request.get_json()
    
    old_status = task.status
    
    for field in ['title', 'description', 'priority', 'subject', 'status', 'recurrence', 'progress_pct', 'subject_id', 'category_id', 'parent_id']:
        if field in data:
            setattr(task, field, data[field])
            
    if 'due_date' in data:
        raw = data['due_date']
        if raw:
            try:
                task.due_date = datetime.strptime(raw, '%Y-%m-%d').date()
            except Exception:
                task.due_date = None
        else:
            task.due_date = None
            
    # Trigger recurrence generation and XP award on transition to Completed
    xp_earned = 0
    if task.status == "Completed" and old_status != "Completed":
        _handle_recurrence(task)
        xp_earned = 20 # 20 XP for task completion
        user.xp_points += xp_earned
        if user.xp_points >= user.level * 100:
            user.xp_points -= user.level * 100
            user.level += 1
            notif = Notification(
                title="Level Up! 🎉",
                message=f"You reached level {user.level} by completing your tasks!",
                category="System",
                user_id=user.id
            )
            db.session.add(notif)
            
    db.session.commit()
    return jsonify({'msg': 'Task updated', 'xp_earned': xp_earned}), 200

@bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    task = Task.query.filter_by(id=task_id, user_id=user.id).first_or_404()
    db.session.delete(task)
    db.session.commit()
    return jsonify({'msg': 'Task deleted'}), 200
