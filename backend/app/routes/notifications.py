from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Notification, User

bp = Blueprint('notifications', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

@bp.route('/', methods=['GET'])
@jwt_required()
def list_notifications():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    limit = request.args.get('limit', default=50, type=int)
    offset = request.args.get('offset', default=0, type=int)
    
    # Query notifications ordered by created_at desc
    notifications = Notification.query.filter_by(user_id=user.id)\
        .order_by(Notification.created_at.desc())\
        .limit(limit).offset(offset).all()
        
    unread_count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
        
    return jsonify({
        'notifications': [{
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'category': n.category,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat()
        } for n in notifications],
        'unread_count': unread_count
    }), 200

@bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(notification_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    notif = Notification.query.filter_by(id=notification_id, user_id=user.id).first_or_404()
    notif.is_read = True
    db.session.commit()
    return jsonify({'msg': 'Notification marked as read'}), 200

@bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_read():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    Notification.query.filter_by(user_id=user.id, is_read=False).update({Notification.is_read: True})
    db.session.commit()
    return jsonify({'msg': 'All notifications marked as read'}), 200

@bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    notif = Notification.query.filter_by(id=notification_id, user_id=user.id).first_or_404()
    db.session.delete(notif)
    db.session.commit()
    return jsonify({'msg': 'Notification deleted'}), 200

@bp.route('/', methods=['DELETE'])
@jwt_required()
def clear_all_notifications():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    Notification.query.filter_by(user_id=user.id).delete()
    db.session.commit()
    return jsonify({'msg': 'All notifications cleared'}), 200
