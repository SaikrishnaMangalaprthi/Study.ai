import os
import sys
import tempfile
import pytest
from flask import Flask

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db

@pytest.fixture(scope='session')
def app():
    # Use a temporary SQLite database for testing
    db_fd, db_path = tempfile.mkstemp()
    os.close(db_fd)
    os.environ['DATABASE_URL'] = f'sqlite:///{db_path}'
    os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret-with-at-least-32-bytes'
    os.environ['SECRET_KEY'] = 'test-app-secret-with-at-least-32-bytes'
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    with app.app_context():
        db.create_all()
        yield app
    # teardown
    # Ensure proper app context for db cleanup
    with app.app_context():
        from app import db as _db
        _db.session.remove()
        engine = _db.engine
        if engine:
            engine.dispose()
    os.remove(db_path)

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()
