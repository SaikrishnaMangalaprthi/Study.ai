from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Reminder, User
from datetime import datetime

bp = Blueprint('reminders', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

@bp.route('/', methods=['GET'])
@jwt_required()
def list_reminders():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    reminders = Reminder.query.filter_by(user_id=user.id).all()
    return jsonify([{
        'id': r.id,
        'title': r.title,
        'remind_at': r.remind_at.isoformat() if r.remind_at else None,
        'repeat': r.repeat
    } for r in reminders]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
def create_reminder():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    data = request.get_json()
    remind_at_raw = data.get('remind_at')
    remind_at = None
    if remind_at_raw:
        try:
            # support ISO datetime format, e.g. 2026-06-14T15:00:00
            remind_at = datetime.fromisoformat(remind_at_raw.replace('Z', ''))
        except Exception:
            pass
            
    reminder = Reminder(
        title=data.get('title'),
        remind_at=remind_at,
        repeat=data.get('repeat', 'Custom'),
        user_id=user.id
    )
    db.session.add(reminder)
    db.session.commit()
    return jsonify({'msg': 'Reminder created', 'id': reminder.id}), 201

@bp.route('/<int:reminder_id>', methods=['PUT'])
@jwt_required()
def update_reminder(reminder_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    reminder = Reminder.query.filter_by(id=reminder_id, user_id=user.id).first_or_404()
    data = request.get_json()
    for field in ['title', 'repeat']:
        if field in data:
            setattr(reminder, field, data[field])
    if 'remind_at' in data:
        raw = data['remind_at']
        if raw:
            try:
                reminder.remind_at = datetime.fromisoformat(raw.replace('Z', ''))
            except Exception:
                reminder.remind_at = None
        else:
            reminder.remind_at = None
    db.session.commit()
    return jsonify({'msg': 'Reminder updated'}), 200

@bp.route('/<int:reminder_id>', methods=['DELETE'])
@jwt_required()
def delete_reminder(reminder_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    reminder = Reminder.query.filter_by(id=reminder_id, user_id=user.id).first_or_404()
    db.session.delete(reminder)
    db.session.commit()
    return jsonify({'msg': 'Reminder deleted'}), 200
@bp.route('/<int:reminder_id>', methods=['PUT'])
@jwt_required()
def update_reminder(reminder_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    reminder = Reminder.query.filter_by(id=reminder_id, user_id=user.id).first_or_404()
    data = request.get_json() or {}
    if 'title' in data:
        reminder.title = data['title']
    if 'remind_at' in data:
        reminder.remind_at = datetime.fromisoformat(data['remind_at']) if data['remind_at'] else None
    if 'repeat' in data:
        reminder.repeat = data['repeat']
    db.session.commit()
    return jsonify({'msg': 'Reminder updated'}), 200