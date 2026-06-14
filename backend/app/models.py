from . import db
from datetime import UTC, datetime


def utc_now():
    return datetime.now(UTC).replace(tzinfo=None)

# Association tables
user_goals = db.Table(
    "user_goals",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
    db.Column("goal_id", db.Integer, db.ForeignKey("goals.id"), primary_key=True),
)

# Core models
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(80))
    created_at = db.Column(db.DateTime, default=utc_now)
    fcm_token = db.Column(db.String(256))  # optional push token
    
    # New profile fields
    avatar_url = db.Column(db.String(500))
    xp_points = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    theme_color = db.Column(db.String(50), default="blue")
    notification_prefs = db.Column(db.String(500), default="{}")  # Stored as JSON string

    # Relationships
    tasks = db.relationship("Task", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    goals = db.relationship("Goal", secondary=user_goals, backref=db.backref("owners", lazy="dynamic"))
    scores = db.relationship("Score", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    habits = db.relationship("Habit", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    reminders = db.relationship("Reminder", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    exams = db.relationship("Exam", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    notes = db.relationship("Note", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    study_sessions = db.relationship("StudySession", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    
    # New relationships
    subjects = db.relationship("Subject", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    categories = db.relationship("Category", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    daily_progresses = db.relationship("DailyProgress", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    pomodoro_sessions = db.relationship("PomodoroSession", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    health_logs = db.relationship("HealthLog", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    notifications = db.relationship("Notification", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    user_achievements = db.relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")

class Subject(db.Model):
    __tablename__ = "subjects"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    color = db.Column(db.String(7), default="#3b82f6") # Hex color, e.g. #3b82f6 (blue)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Back-relations
    tasks = db.relationship("Task", backref="subject_rel", lazy="dynamic")
    exams = db.relationship("Exam", backref="subject_rel", lazy="dynamic")
    notes = db.relationship("Note", backref="subject_rel", lazy="dynamic")
    scores = db.relationship("Score", backref="subject_rel", lazy="dynamic")
    pomodoro_sessions = db.relationship("PomodoroSession", backref="subject_rel", lazy="dynamic")

class Category(db.Model):
    __tablename__ = "categories"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    tasks = db.relationship("Task", backref="category_rel", lazy="dynamic")

class Task(db.Model):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.Enum("High", "Medium", "Low"), default="Medium")
    subject = db.Column(db.String(80)) # for backwards compatibility
    due_date = db.Column(db.Date)
    status = db.Column(db.Enum("Pending", "In Progress", "Completed"), default="Pending")
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    
    # New task fields
    recurrence = db.Column(db.Enum("None", "Daily", "Weekly", "Monthly"), default="None")
    parent_id = db.Column(db.Integer, db.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    progress_pct = db.Column(db.Integer, default=0) # 0 to 100
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)

    # Self-referential subtasks relationship
    subtasks = db.relationship("Task", backref=db.backref("parent", remote_side=[id]), lazy="dynamic")

class Goal(db.Model):
    __tablename__ = "goals"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    target_percent = db.Column(db.Integer, default=0)
    deadline = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=utc_now)
    
    # New goal fields
    status = db.Column(db.Enum("Active", "Completed", "Overdue"), default="Active")
    milestones = db.relationship("Milestone", backref="goal", lazy="dynamic", cascade="all, delete-orphan")

    def __init__(self, title, description=None, target_percent=0, deadline=None, status="Active", **kwargs):
        self.title = title
        self.description = description
        self.target_percent = target_percent
        self.deadline = deadline
        self.status = status
        for k, v in kwargs.items():
            setattr(self, k, v)

class Milestone(db.Model):
    __tablename__ = "milestones"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    goal_id = db.Column(db.Integer, db.ForeignKey("goals.id"), nullable=False)

    def __init__(self, title, completed=False, goal=None, goal_id=None, **kwargs):
        self.title = title
        self.completed = completed
        if goal is not None:
            self.goal = goal
        if goal_id is not None:
            self.goal_id = goal_id
        for k, v in kwargs.items():
            setattr(self, k, v)

class Score(db.Model):
    __tablename__ = "scores"
    id = db.Column(db.Integer, primary_key=True)
    exam_name = db.Column(db.String(120))
    subject = db.Column(db.String(80)) # for backwards compatibility
    obtained = db.Column(db.Float)
    total = db.Column(db.Float)
    date = db.Column(db.Date)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)

class Habit(db.Model):
    __tablename__ = "habits"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    streak = db.Column(db.Integer, default=0)
    target_percentage = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    
    # New habit fields
    longest_streak = db.Column(db.Integer, default=0)
    last_checked_in = db.Column(db.Date)
    check_ins = db.relationship("HabitCheckIn", backref="habit", lazy="dynamic", cascade="all, delete-orphan")

class HabitCheckIn(db.Model):
    __tablename__ = "habit_checkins"
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey("habits.id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    completed = db.Column(db.Boolean, default=True)
    __table_args__ = (db.UniqueConstraint('habit_id', 'date', name='_habit_checkin_uc'),)

class Reminder(db.Model):
    __tablename__ = "reminders"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    remind_at = db.Column(db.DateTime)
    repeat = db.Column(db.Enum("Daily", "Weekly", "Monthly", "Custom"))
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

class Exam(db.Model):
    __tablename__ = "exams"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    exam_date = db.Column(db.Date)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    
    # New exam fields
    priority = db.Column(db.Enum("High", "Medium", "Low"), default="Medium")
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    subject = db.Column(db.String(80)) # backwards compatibility
    syllabus_progress = db.Column(db.Integer, default=0) # 0 to 100 percentage
    status = db.Column(db.Enum("Upcoming", "Completed"), default="Upcoming")

class Note(db.Model):
    __tablename__ = "notes"
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200))
    url = db.Column(db.String(500))
    subject = db.Column(db.String(80)) # backwards compatibility
    uploaded_at = db.Column(db.DateTime, default=utc_now)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    
    # New note fields
    content = db.Column(db.Text)
    tags = db.Column(db.String(200), default="") # comma-separated
    is_pinned = db.Column(db.Boolean, default=False)
    is_favorite = db.Column(db.Boolean, default=False)
    color = db.Column(db.String(20), default="gray")
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)

class StudySession(db.Model):
    __tablename__ = "study_sessions"
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    focus_type = db.Column(db.Enum("Pomodoro", "Custom"))
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    notes = db.Column(db.Text)

class DailyProgress(db.Model):
    __tablename__ = "daily_progress"
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    study_hours = db.Column(db.Float, default=0.0)
    tasks_completed = db.Column(db.Integer, default=0)
    habit_completion = db.Column(db.Float, default=0.0) # Percentage 0 to 100
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='_user_date_uc'),)

class PomodoroSession(db.Model):
    __tablename__ = "pomodoro_sessions"
    id = db.Column(db.Integer, primary_key=True)
    duration = db.Column(db.Integer, nullable=False) # standard is 25 or 50, or custom minutes
    break_time = db.Column(db.Integer, default=5) # break in minutes
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utc_now)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)

class Achievement(db.Model):
    __tablename__ = "achievements"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(255))
    icon = db.Column(db.String(80)) # e.g. "7-day-streak", "100-hours"
    xp_reward = db.Column(db.Integer, default=0)
    
    user_achievements = db.relationship("UserAchievement", back_populates="achievement", cascade="all, delete-orphan")

class UserAchievement(db.Model):
    __tablename__ = "user_achievements"
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), primary_key=True)
    achievement_id = db.Column(db.Integer, db.ForeignKey("achievements.id"), primary_key=True)
    earned_at = db.Column(db.DateTime, default=utc_now)
    
    user = db.relationship("User", back_populates="user_achievements")
    achievement = db.relationship("Achievement", back_populates="user_achievements")

class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default="General") # e.g. "Task", "Exam", "Achievement", "System"
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utc_now)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

class HealthLog(db.Model):
    __tablename__ = "health_logs"
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    water_ml = db.Column(db.Integer, default=0) # ml of water consumed
    sleep_hours = db.Column(db.Float, default=0.0) # hours of sleep
    exercise_min = db.Column(db.Integer, default=0) # minutes of exercise
    weight_kg = db.Column(db.Float) # weight in kg
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='_user_health_date_uc'),)
