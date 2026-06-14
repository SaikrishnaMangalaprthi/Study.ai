from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Subject, User

bp = Blueprint('subjects', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

@bp.route('/', methods=['GET'])
@jwt_required()
def list_subjects():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    subjects = Subject.query.filter_by(user_id=user.id).all()
    return jsonify([{
        'id': s.id,
        'name': s.name,
        'color': s.color
    } for s in subjects]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
def create_subject():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'msg': 'Subject name is required'}), 400
    subject = Subject(
        name=name,
        color=data.get('color', '#3b82f6'),
        user_id=user.id
    )
    db.session.add(subject)
    db.session.commit()
    return jsonify({'msg': 'Subject created', 'id': subject.id}), 201

@bp.route('/<int:subject_id>', methods=['PUT'])
@jwt_required()
def update_subject(subject_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    subject = Subject.query.filter_by(id=subject_id, user_id=user.id).first_or_404()
    data = request.get_json()
    if 'name' in data:
        name = data['name'].strip()
        if not name:
            return jsonify({'msg': 'Subject name cannot be empty'}), 400
        subject.name = name
    if 'color' in data:
        subject.color = data['color']
    db.session.commit()
    return jsonify({'msg': 'Subject updated'}), 200

@bp.route('/<int:subject_id>', methods=['DELETE'])
@jwt_required()
def delete_subject(subject_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    subject = Subject.query.filter_by(id=subject_id, user_id=user.id).first_or_404()
    db.session.delete(subject)
    db.session.commit()
    return jsonify({'msg': 'Subject deleted'}), 200
