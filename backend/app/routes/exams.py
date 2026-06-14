from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Exam, User
from datetime import datetime, date as dt_date

bp = Blueprint('exams', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

@bp.route('/', methods=['GET'])
@jwt_required()
def list_exams():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    exams = Exam.query.filter_by(user_id=user.id).order_by(Exam.exam_date.asc().nullslast()).all()
    
    res = []
    today = dt_date.today()
    for e in exams:
        countdown = None
        if e.exam_date:
            countdown = (e.exam_date - today).days
            
        res.append({
            'id': e.id,
            'name': e.name,
            'exam_date': e.exam_date.isoformat() if e.exam_date else None,
            'countdown': countdown,
            'priority': e.priority,
            'subject': e.subject,
            'subject_id': e.subject_id,
            'subject_color': e.subject_rel.color if e.subject_rel else None,
            'syllabus_progress': e.syllabus_progress,
            'status': e.status
        })
    return jsonify(res), 200

@bp.route('/', methods=['POST'])
@jwt_required()
def create_exam():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    data = request.get_json()
    
    exam_date = None
    if data.get('exam_date'):
        try:
            exam_date = datetime.strptime(data['exam_date'], '%Y-%m-%d').date()
        except Exception:
            pass
            
    exam = Exam(
        name=data.get('name'),
        exam_date=exam_date,
        priority=data.get('priority', 'Medium'),
        subject=data.get('subject', ''),
        subject_id=data.get('subject_id') if data.get('subject_id') else None,
        syllabus_progress=data.get('syllabus_progress', 0),
        status=data.get('status', 'Upcoming'),
        user_id=user.id
    )
    db.session.add(exam)
    db.session.commit()
    return jsonify({'msg': 'Exam created', 'id': exam.id}), 201

@bp.route('/<int:exam_id>', methods=['PUT'])
@jwt_required()
def update_exam(exam_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    exam = Exam.query.filter_by(id=exam_id, user_id=user.id).first_or_404()
    data = request.get_json()
    
    for field in ['name', 'priority', 'subject', 'subject_id', 'syllabus_progress', 'status']:
        if field in data:
            setattr(exam, field, data[field])
            
    if 'exam_date' in data:
        raw = data['exam_date']
        if raw:
            try:
                exam.exam_date = datetime.strptime(raw, '%Y-%m-%d').date()
            except Exception:
                exam.exam_date = None
        else:
            exam.exam_date = None
            
    db.session.commit()
    return jsonify({'msg': 'Exam updated'}), 200

@bp.route('/<int:exam_id>', methods=['DELETE'])
@jwt_required()
def delete_exam(exam_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    exam = Exam.query.filter_by(id=exam_id, user_id=user.id).first_or_404()
    db.session.delete(exam)
    db.session.commit()
    return jsonify({'msg': 'Exam deleted'}), 200
