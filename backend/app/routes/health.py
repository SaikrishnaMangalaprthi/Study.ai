from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, HealthLog, User
from datetime import datetime, date as dt_date

bp = Blueprint('health', __name__)

def _get_user(identity):
    return User.query.filter_by(email=identity).first()

@bp.route('/', methods=['GET'])
@jwt_required()
def get_health_log():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    date_str = request.args.get('date')
    if date_str:
        try:
            log_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except Exception:
            return jsonify({'msg': 'Invalid date format'}), 400
    else:
        log_date = dt_date.today()
        
    log = HealthLog.query.filter_by(user_id=user.id, date=log_date).first()
    if not log:
        # Return empty default log
        return jsonify({
            'date': log_date.isoformat(),
            'water_ml': 0,
            'sleep_hours': 0.0,
            'exercise_min': 0,
            'weight_kg': 0.0,
            'exists': False
        }), 200
        
    return jsonify({
        'id': log.id,
        'date': log.date.isoformat(),
        'water_ml': log.water_ml,
        'sleep_hours': log.sleep_hours,
        'exercise_min': log.exercise_min,
        'weight_kg': log.weight_kg or 0.0,
        'exists': True
    }), 200

@bp.route('/history', methods=['GET'])
@jwt_required()
def get_health_history():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    logs = HealthLog.query.filter_by(user_id=user.id).order_by(HealthLog.date.desc()).limit(30).all()
    # Return chronologically for charts
    logs.reverse()
    
    return jsonify([{
        'id': l.id,
        'date': l.date.isoformat(),
        'water_ml': l.water_ml,
        'sleep_hours': l.sleep_hours,
        'exercise_min': l.exercise_min,
        'weight_kg': l.weight_kg or 0.0
    } for l in logs]), 200

@bp.route('/', methods=['POST'])
@jwt_required()
def save_health_log():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    data = request.get_json() or {}
    
    date_str = data.get('date')
    if date_str:
        try:
            log_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except Exception:
            return jsonify({'msg': 'Invalid date format'}), 400
    else:
        log_date = dt_date.today()
        
    log = HealthLog.query.filter_by(user_id=user.id, date=log_date).first()
    
    if log:
        # Update existing
        if 'water_ml' in data:
            log.water_ml = data['water_ml']
        if 'sleep_hours' in data:
            log.sleep_hours = float(data['sleep_hours'])
        if 'exercise_min' in data:
            log.exercise_min = int(data['exercise_min'])
        if 'weight_kg' in data:
            log.weight_kg = float(data['weight_kg'])
    else:
        # Create new
        log = HealthLog(
            date=log_date,
            water_ml=data.get('water_ml', 0),
            sleep_hours=float(data.get('sleep_hours', 0.0)),
            exercise_min=int(data.get('exercise_min', 0)),
            weight_kg=float(data.get('weight_kg')) if data.get('weight_kg') else None,
            user_id=user.id
        )
        db.session.add(log)
        
    db.session.commit()
    return jsonify({'msg': 'Health log saved', 'id': log.id}), 200

@bp.route('/bmi', methods=['GET'])
@jwt_required()
def calculate_bmi():
    user = _get_user(get_jwt_identity())
    if not user:
        return jsonify({'msg': 'User not found'}), 404
        
    height_cm = request.args.get('height_cm', type=float)
    if not height_cm or height_cm <= 0:
        return jsonify({'msg': 'Valid height_cm parameter is required'}), 400
        
    # Get latest weight
    latest_log = HealthLog.query.filter(
        HealthLog.user_id == user.id,
        HealthLog.weight_kg.isnot(None)
    ).order_by(HealthLog.date.desc()).first()
    
    if not latest_log or not latest_log.weight_kg:
        return jsonify({'msg': 'No weight logs found. Please log weight first.'}), 404
        
    height_m = height_cm / 100.0
    bmi = latest_log.weight_kg / (height_m * height_m)
    
    # Classify BMI
    category = "Normal"
    if bmi < 18.5:
        category = "Underweight"
    elif bmi >= 25 and bmi < 29.9:
        category = "Overweight"
    elif bmi >= 29.9:
        category = "Obese"
        
    return jsonify({
        'bmi': round(bmi, 1),
        'category': category,
        'weight_kg': latest_log.weight_kg,
        'height_cm': height_cm
    }), 200
