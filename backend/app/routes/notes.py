import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Note, User
from datetime import datetime

bp = Blueprint('notes', __name__)
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

@bp.route('/', methods=['GET'])
@jwt_required()
def list_notes():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    query = Note.query.filter_by(user_id=user.id)
    
    # Search and filters
    search = request.args.get('search')
    if search:
        query = query.filter(
            (Note.filename.like(f'%{search}%')) | 
            (Note.content.like(f'%{search}%')) | 
            (Note.tags.like(f'%{search}%'))
        )
        
    subject_id = request.args.get('subject_id')
    if subject_id:
        query = query.filter_by(subject_id=int(subject_id))
        
    is_pinned = request.args.get('is_pinned')
    if is_pinned is not None:
        query = query.filter_by(is_pinned=(is_pinned.lower() == 'true'))
        
    is_favorite = request.args.get('is_favorite')
    if is_favorite is not None:
        query = query.filter_by(is_favorite=(is_favorite.lower() == 'true'))

    # Sort pinned notes first, then uploaded_at desc
    notes = query.order_by(Note.is_pinned.desc(), Note.uploaded_at.desc()).all()
    
    return jsonify([{
        'id': n.id,
        'filename': n.filename,
        'url': n.url,
        'subject': n.subject,
        'subject_id': n.subject_id,
        'subject_color': n.subject_rel.color if n.subject_rel else None,
        'uploaded_at': n.uploaded_at.isoformat(),
        'content': n.content or '',
        'tags': n.tags or '',
        'is_pinned': n.is_pinned,
        'is_favorite': n.is_favorite,
        'color': n.color or 'gray'
    } for n in notes]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
def create_or_upload_note():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    # Check if request is JSON (creating rich text/markdown notes)
    if request.is_json:
        data = request.get_json()
        title = data.get('title', '').strip()
        if not title:
            return jsonify({'msg': 'Note title is required'}), 400
        
        note = Note(
            filename=title,
            content=data.get('content', ''),
            tags=data.get('tags', ''),
            is_pinned=data.get('is_pinned', False),
            is_favorite=data.get('is_favorite', False),
            color=data.get('color', 'gray'),
            subject_id=data.get('subject_id'),
            subject=data.get('subject', ''),
            user_id=user.id
        )
        db.session.add(note)
        db.session.commit()
        return jsonify({'msg': 'Note created', 'id': note.id}), 201
        
    # Fallback to file upload (original code)
    if 'file' not in request.files:
        return jsonify({'msg': 'No file part or JSON data'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'msg': 'No selected file'}), 400
        
    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)
    url = f'/uploads/{filename}'
    
    note = Note(
        filename=filename,
        url=url,
        subject=request.form.get('subject', ''),
        subject_id=request.form.get('subject_id') if request.form.get('subject_id') else None,
        user_id=user.id,
    )
    db.session.add(note)
    db.session.commit()
    return jsonify({'msg': 'Note uploaded', 'id': note.id, 'url': url}), 201

@bp.route('/<int:note_id>', methods=['PUT'])
@jwt_required()
def update_note(note_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    note = Note.query.filter_by(id=note_id, user_id=user.id).first_or_404()
    
    data = request.get_json()
    if 'title' in data:
        note.filename = data['title']
    if 'content' in data:
        note.content = data['content']
    if 'tags' in data:
        note.tags = data['tags']
    if 'is_pinned' in data:
        note.is_pinned = data['is_pinned']
    if 'is_favorite' in data:
        note.is_favorite = data['is_favorite']
    if 'color' in data:
        note.color = data['color']
    if 'subject_id' in data:
        note.subject_id = data['subject_id']
    if 'subject' in data:
        note.subject = data['subject']
        
    db.session.commit()
    return jsonify({'msg': 'Note updated'}), 200

@bp.route('/<int:note_id>', methods=['DELETE'])
@jwt_required()
def delete_note(note_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    note = Note.query.filter_by(id=note_id, user_id=user.id).first_or_404()
    
    if note.url: # If it has an uploaded file
        try:
            os.remove(os.path.join(UPLOAD_FOLDER, note.filename))
        except OSError:
            pass
            
    db.session.delete(note)
    db.session.commit()
    return jsonify({'msg': 'Note deleted'}), 200
