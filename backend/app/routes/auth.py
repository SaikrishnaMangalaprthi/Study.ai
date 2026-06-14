from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from ..models import db, User

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', '')
    if not email or not password:
        return jsonify({"msg": "email and password required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "user already exists"}), 400
    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        name=name,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"msg": "registered"}), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"msg": "bad credentials"}), 401
    access_token = create_access_token(identity=email)
    return jsonify(access_token=access_token, name=user.name), 200

@bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    email = get_jwt_identity()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'msg': 'not found'}), 404
    return jsonify(id=user.id, email=user.email, name=user.name), 200
