from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Score, User
from datetime import datetime

bp = Blueprint('scores', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

def _parse_date(raw):
    if not raw:
        return None
    try:
        return datetime.strptime(raw, '%Y-%m-%d').date()
    except Exception:
        return None

@bp.route('/', methods=['GET'])
@jwt_required()
def list_scores():
    user_id = get_jwt_identity()
    user = _get_user(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    scores = Score.query.filter_by(user_id=user.id).all()
    return jsonify([{
        'id': s.id,
        'exam_name': s.exam_name,
        'subject': s.subject,
        'obtained': s.obtained,
        'total': s.total,
        'date': s.date.isoformat() if s.date else None
    } for s in scores])

@bp.route('/', methods=['POST'])
@jwt_required()
def create_score():
    user_id = get_jwt_identity()
    user = _get_user(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    data = request.get_json()
    score = Score(
        exam_name=data.get('exam_name'),
        subject=data.get('subject'),
        obtained=data.get('obtained'),
        total=data.get('total'),
        date=_parse_date(data.get('date')),
        user_id=user.id,
    )
    db.session.add(score)
    db.session.commit()
    return jsonify({'msg': 'Score added', 'id': score.id}), 201

@bp.route('/<int:score_id>', methods=['PUT'])
@jwt_required()
def update_score(score_id):
    data = request.get_json()
    score = db.get_or_404(Score, score_id)
    for field in ['exam_name', 'subject', 'obtained', 'total']:
        if field in data:
            setattr(score, field, data[field])
    if 'date' in data:
        score.date = _parse_date(data['date'])
    db.session.commit()
    return jsonify({'msg': 'Score updated'}), 200

@bp.route('/<int:score_id>', methods=['DELETE'])
@jwt_required()
def delete_score(score_id):
    score = db.get_or_404(Score, score_id)
    db.session.delete(score)
    db.session.commit()
    return jsonify({'msg': 'Score deleted'}), 200
