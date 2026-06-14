from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Goal, User, Milestone
from datetime import datetime

bp = Blueprint('goals', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

@bp.route('/', methods=['GET'])
@jwt_required()
def list_goals():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    goals = user.goals
    return jsonify([{
        'id': g.id,
        'title': g.title,
        'description': g.description,
        'target_percent': g.target_percent,
        'status': g.status,
        'deadline': g.deadline.isoformat() if g.deadline else None,
        'milestones': [{
            'id': m.id,
            'title': m.title,
            'completed': m.completed
        } for m in g.milestones]
    } for g in goals]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
def create_goal():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    data = request.get_json()
    deadline_raw = data.get('deadline')
    deadline = None
    if deadline_raw:
        try:
            deadline = datetime.strptime(deadline_raw, "%Y-%m-%d").date()
        except Exception:
            deadline = None
    goal = Goal(
        title=data['title'],
        description=data.get('description', ''),
        target_percent=data.get('target_percent', 0),
        status=data.get('status', 'Active'),
        deadline=deadline
    )
    db.session.add(goal)
    user.goals.append(goal)
    
    # Optional initial milestones
    milestones_data = data.get('milestones', [])
    for m_title in milestones_data:
        if isinstance(m_title, str) and m_title.strip():
            m = Milestone(title=m_title.strip(), completed=False, goal=goal)
            db.session.add(m)
            
    db.session.commit()
    return jsonify({'msg': 'Goal created', 'id': goal.id}), 201

@bp.route('/<int:goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    goal = db.get_or_404(Goal, goal_id)
    if user not in goal.owners:
        return jsonify({'msg': 'Permission denied'}), 403
    data = request.get_json()
    for field in ['title', 'description', 'target_percent', 'status']:
        if field in data:
            setattr(goal, field, data[field])
    if 'deadline' in data:
        deadline_raw = data['deadline']
        if deadline_raw:
            try:
                goal.deadline = datetime.strptime(deadline_raw, "%Y-%m-%d").date()
            except Exception:
                goal.deadline = None
        else:
            goal.deadline = None
    db.session.commit()
    return jsonify({'msg': 'Goal updated'}), 200

@bp.route('/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    goal = db.get_or_404(Goal, goal_id)
    if user not in goal.owners:
        return jsonify({'msg': 'Permission denied'}), 403
    db.session.delete(goal)
    db.session.commit()
    return jsonify({'msg': 'Goal deleted'}), 200

# Milestones routes
@bp.route('/<int:goal_id>/milestones', methods=['POST'])
@jwt_required()
def add_milestone(goal_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    goal = db.get_or_404(Goal, goal_id)
    if user not in goal.owners:
        return jsonify({'msg': 'Permission denied'}), 403
    data = request.get_json()
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'msg': 'Milestone title required'}), 400
    milestone = Milestone(title=title, completed=False, goal_id=goal.id)
    db.session.add(milestone)
    db.session.commit()
    return jsonify({'msg': 'Milestone added', 'id': milestone.id}), 201

@bp.route('/milestones/<int:milestone_id>', methods=['PUT'])
@jwt_required()
def update_milestone(milestone_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    milestone = db.get_or_404(Milestone, milestone_id)
    # verify ownership
    if user not in milestone.goal.owners:
        return jsonify({'msg': 'Permission denied'}), 403
    data = request.get_json()
    if 'title' in data:
        milestone.title = data['title']
    if 'completed' in data:
        milestone.completed = data['completed']
    db.session.commit()
    return jsonify({'msg': 'Milestone updated'}), 200

@bp.route('/milestones/<int:milestone_id>', methods=['DELETE'])
@jwt_required()
def delete_milestone(milestone_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    milestone = db.get_or_404(Milestone, milestone_id)
    if user not in milestone.goal.owners:
        return jsonify({'msg': 'Permission denied'}), 403
    db.session.delete(milestone)
    db.session.commit()
    return jsonify({'msg': 'Milestone deleted'}), 200
