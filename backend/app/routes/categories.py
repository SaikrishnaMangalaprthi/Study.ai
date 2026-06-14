from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Category, User

bp = Blueprint('categories', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

@bp.route('/', methods=['GET'])
@jwt_required()
def list_categories():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    categories = Category.query.filter_by(user_id=user.id).all()
    return jsonify([{
        'id': c.id,
        'name': c.name
    } for c in categories]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
def create_category():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'msg': 'Category name is required'}), 400
    category = Category(
        name=name,
        user_id=user.id
    )
    db.session.add(category)
    db.session.commit()
    return jsonify({'msg': 'Category created', 'id': category.id}), 201

@bp.route('/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    category = Category.query.filter_by(id=category_id, user_id=user.id).first_or_404()
    data = request.get_json()
    if 'name' in data:
        name = data['name'].strip()
        if not name:
            return jsonify({'msg': 'Category name cannot be empty'}), 400
        category.name = name
    db.session.commit()
    return jsonify({'msg': 'Category updated'}), 200

@bp.route('/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    category = Category.query.filter_by(id=category_id, user_id=user.id).first_or_404()
    db.session.delete(category)
    db.session.commit()
    return jsonify({'msg': 'Category deleted'}), 200
