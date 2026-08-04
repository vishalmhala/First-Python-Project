
from fastapi import FastAPI, Depends
from groq import Groq
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware 

# Import from your other files
from database import get_db
from models import Message, Conversation, User

# Load environment variables
load_dotenv()

# Create Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Create FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ===== Authentication Setup =====
SECRET_KEY = "your-secret-key-change-this"  # Change in production!
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"])

# ===== Authentication Helper Functions =====
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hash: str) -> bool:
    return pwd_context.verify(password, hash)

def create_access_token(user_id: int):
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode = {"user_id": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# System prompt for Python tutor
SYSTEM_PROMPT = """You are an expert Python programming tutor.
Your role is to:
  - Explain Python concepts clearly
  - Provide code examples
  - Help debug code
  - Suggest best practices

When answering:
  - Provide step-by-step explanations
  - Include working code examples
  - Explain WHY, not just WHAT
  - Suggest improvements

Be encouraging and patient."""

# ===== ENDPOINT 1: Welcome =====
@app.get("/")
async def read_root():
    """Welcome endpoint"""
    return {"Hello": "World"}

# ===== ENDPOINT 2: Ask Question & Save to Database (token-protected) =====
@app.post("/api/ask")
async def ask_agent(
    message: str,
    token: str,  # Add token parameter
    conversation_id: int = None,
    db: Session = Depends(get_db)
):
    """
    Ask the AI a question and save to database.
    Requires a valid token instead of a raw user_id.
    """

    try:
        # Verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")

        if not user_id:
            return {"error": "Invalid token", "status": "error", "code": 401}

        # Create or get conversation
        if not conversation_id:
            conv = Conversation(user_id=user_id)
            db.add(conv)
            db.commit()
            db.refresh(conv)
            conversation_id = conv.id

        # Save user message
        user_message = Message(
            conversation_id=conversation_id,
            role="user",
            text=message
        )
        db.add(user_message)
        db.commit()

        # Call Groq AI
        chat_completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            max_tokens=1024,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
        )

        # Extract response
        agent_response = chat_completion.choices[0].message.content

        # Save AI response
        agent_message = Message(
            conversation_id=conversation_id,
            role="agent",
            text=agent_response,
            confidence=90
        )
        db.add(agent_message)
        db.commit()

        # Return response
        return {
            "question": message,
            "response": agent_response,
            "conversation_id": conversation_id,
            "status": "success",
            "confidence": 90
        }

    except JWTError:
        return {"error": "Invalid token", "status": "error", "code": 401}

    except Exception as e:
        return {
            "question": message,
            "response": f"Error: {str(e)}",
            "status": "error"
        }

# ===== ENDPOINT 3: Get All Conversations =====
@app.get("/api/conversations")
async def get_all_conversations(
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    """
    Get all conversations for a user
    """

    conversations = db.query(Conversation)\
        .filter(Conversation.user_id == user_id)\
        .order_by(Conversation.created_at.desc())\
        .all()

    return {
        "user_id": user_id,
        "total_conversations": len(conversations),
        "conversations": [
            {
                "id": conv.id,
                "created_at": str(conv.created_at),
                "title": conv.title or f"Conversation {conv.id}"
            }
            for conv in conversations
        ]
    }

# ===== ENDPOINT 4: Get Conversation Messages =====
@app.get("/api/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all messages from a conversation
    """

    # Get all messages
    messages = db.query(Message)\
        .filter(Message.conversation_id == conversation_id)\
        .order_by(Message.created_at)\
        .all()

    # Get conversation details
    conversation = db.query(Conversation)\
        .filter(Conversation.id == conversation_id)\
        .first()

    if not conversation:
        return {"error": "Conversation not found"}

    return {
        "conversation_id": conversation_id,
        "user_id": conversation.user_id,
        "created_at": str(conversation.created_at),
        "total_messages": len(messages),
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "text": msg.text,
                "confidence": msg.confidence,
                "created_at": str(msg.created_at)
            }
            for msg in messages
        ]
    }

# ===== ENDPOINT 5: Delete Conversation =====
@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a conversation and all its messages
    """

    # Delete all messages
    db.query(Message)\
        .filter(Message.conversation_id == conversation_id)\
        .delete()

    # Delete conversation
    db.query(Conversation)\
        .filter(Conversation.id == conversation_id)\
        .delete()

    db.commit()

    return {
        "message": f"Conversation {conversation_id} deleted",
        "status": "success"
    }

# ===== ENDPOINT 6: Login =====
@app.post("/api/auth/login")
async def login(email: str, password: str, db = Depends(get_db)):
    # Find user
    user = db.query(User).filter_by(email=email).first()

    if not user:
        return {"error": "Invalid credentials", "status": "error"}

    # Check password
    if not verify_password(password, user.password_hash):
        return {"error": "Invalid credentials", "status": "error"}

    # Create token
    token = create_access_token(user.id)

    return {
        "token": token,
        "user_id": user.id,
        "status": "success"
    }

# ===== ENDPOINT 7: Signup =====
@app.post("/api/auth/signup")
async def signup(email: str, password: str, db = Depends(get_db)):

    # Check if user exists
    user = db.query(User).filter_by(email=email).first()
    if user:
        return {"error": "Email already exists", "status": "error"}

    # Create new user
    hashed_password = hash_password(password)
    new_user = User(email=email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()

    # Create token
    token = create_access_token(new_user.id)

    return {
        "token": token,
        "user_id": new_user.id,
        "status": "success"
    }
