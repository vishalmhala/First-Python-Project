
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

# Use SQLite for now (local, simple)
DATABASE_URL = "sqlite:///./agent.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



        