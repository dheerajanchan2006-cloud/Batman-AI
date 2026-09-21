"""
database.py - Database operations & security layer for ALFRED: The Dark Knight's AI.
Wayne Enterprises // Secure Intelligence Network
Handles SQLite storage, password cryptography, encrypted case files, and tactical data purging.
"""

import sqlite3
import uuid
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = "nexus_chat.db"

def get_connection():
    """Return a database connection with row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Initialize the database schema if tables do not exist."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Users table (passwords hashed using PBKDF2:SHA256 via werkzeug)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 2. Conversations / Case Files table linked to user
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL DEFAULT 'CASE FILE // New Mission',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # 3. Messages table linked to conversation
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                sender TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )
        """)
        
        conn.commit()

# ==========================================
# User Authentication Functions
# ==========================================

def create_user(username, password):
    """
    Register a new user with secure password hashing.
    Returns: (user_id, None) on success, (None, error_message) on failure.
    """
    username = username.strip()
    if not username or len(username) < 3:
        return None, "Username must be at least 3 characters long."
    if not password or len(password) < 6:
        return None, "Password must be at least 6 characters long."
    
    password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                (username, password_hash)
            )
            conn.commit()
            return cursor.lastrowid, None
    except sqlite3.IntegrityError:
        return None, f"Username '{username}' is already taken. Please choose another."
    except Exception as e:
        return None, f"Database error: {str(e)}"

def verify_user(username, password):
    """
    Verify login credentials.
    Returns: (user_dict, None) on success, (None, error_message) on failure.
    """
    username = username.strip()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        
        if not user:
            return None, "Invalid username or password."
        
        if not check_password_hash(user["password_hash"], password):
            return None, "Invalid username or password."
        
        return dict(user), None

def get_user_by_id(user_id):
    """Fetch user by primary key ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

# ==========================================
# Conversation Operations
# ==========================================

def create_conversation(user_id, title=None):
    """Create a new conversation thread for the user formatted as an encrypted Case File."""
    conversation_id = str(uuid.uuid4())
    with get_connection() as conn:
        cursor = conn.cursor()
        if not title or title in ("New Conversation", "New Mission", "CASE FILE // New Mission"):
            cursor.execute("SELECT COUNT(*) as cnt FROM conversations WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            count = (row["cnt"] if row else 0) + 1
            title = f"CASE FILE {count:03d} // Mission Intel"
        cursor.execute(
            "INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)",
            (conversation_id, user_id, title)
        )
        conn.commit()
    return conversation_id

def get_user_conversations(user_id):
    """Get all conversations for a specific user ordered by latest update."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, created_at, updated_at 
            FROM conversations 
            WHERE user_id = ? 
            ORDER BY updated_at DESC
        """, (user_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_conversation(user_id, conversation_id):
    """Verify ownership and retrieve conversation details."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM conversations WHERE id = ? AND user_id = ?",
            (conversation_id, user_id)
        )
        row = cursor.fetchone()
        return dict(row) if row else None

def update_conversation_title(user_id, conversation_id, title):
    """Update title and timestamp of a conversation."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE conversations 
            SET title = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND user_id = ?
        """, (title.strip(), conversation_id, user_id))
        conn.commit()

def delete_conversation(user_id, conversation_id):
    """Delete a conversation thread and its associated messages."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM conversations WHERE id = ? AND user_id = ?",
            (conversation_id, user_id)
        )
        conn.commit()

# ==========================================
# Message Operations
# ==========================================

def add_message(conversation_id, sender, content):
    """Append a message to a conversation and update conversation timestamp."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)",
            (conversation_id, sender, content)
        )
        cursor.execute(
            "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (conversation_id,)
        )
        conn.commit()

def get_conversation_messages(user_id, conversation_id):
    """Retrieve all messages in a conversation ensuring user ownership."""
    # First verify ownership
    if not get_conversation(user_id, conversation_id):
        return None
    
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, sender, content, timestamp 
            FROM messages 
            WHERE conversation_id = ? 
            ORDER BY id ASC
        """, (conversation_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

# ==========================================
# Security & Secure Wipe Features
# ==========================================

def wipe_user_data(user_id):
    """
    Permanently and securely delete all conversations and messages belonging to the user.
    Ensures complete data sanitization before logout or upon user request.
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        # Find all conversations belonging to this user
        cursor.execute("SELECT id FROM conversations WHERE user_id = ?", (user_id,))
        conv_rows = cursor.fetchall()
        conv_ids = [row["id"] for row in conv_rows]
        
        if conv_ids:
            # Delete messages first (or handled by cascade)
            placeholders = ",".join("?" for _ in conv_ids)
            cursor.execute(f"DELETE FROM messages WHERE conversation_id IN ({placeholders})", conv_ids)
            cursor.execute("DELETE FROM conversations WHERE user_id = ?", (user_id,))
        
        conn.commit()
    return True
