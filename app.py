"""
app.py - High-Tech AI Chatbot Backend powered by Flask & Groq API
Includes user authentication, session security, conversation history management,
and real-time streaming AI responses.
"""

import os
import json
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, Response, stream_with_context
from dotenv import load_dotenv

import database

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Security configuration
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "nexus_super_secret_production_key_9921_alpha")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False  # Set to True if running exclusively on HTTPS

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "openai/gpt-oss-120b")

AVAILABLE_MODELS = [
    {"id": "openai/gpt-oss-120b", "name": "GPT-OSS 120B (Deep Reasoning & Smart)"},
    {"id": "openai/gpt-oss-20b", "name": "GPT-OSS 20B (Ultra-Fast & Light)"},
    {"id": "qwen/qwen3.8-27b", "name": "Qwen 3.8 27B (High Capability)"},
    {"id": "groq/compound", "name": "Groq Compound (Agentic Intelligence)"}
]

# Initialize database schema
database.init_db()

# ==========================================
# Authentication Decorator & Helpers
# ==========================================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            if request.path.startswith("/api/"):
                return jsonify({"error": "Authentication required. Please log in."}), 401
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function

def get_groq_client():
    """Safely obtain Groq client or None if key is not configured."""
    load_dotenv(override=True)
    key = os.getenv("GROQ_API_KEY", "").strip()
    if not key or key == "your_groq_api_key_here":
        return None
    try:
        from groq import Groq
        return Groq(api_key=key)
    except Exception as e:
        print(f"Error initializing Groq client: {e}")
        return None

# ==========================================
# Authentication Routes
# ==========================================

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        data = request.form if request.form else request.get_json(silent=True) or {}
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        
        user, error = database.verify_user(username, password)
        if error:
            if request.is_json:
                return jsonify({"success": False, "error": error}), 400
            return render_template("login.html", error=error, tab="login")
        
        # Regenerate session data for security
        session.clear()
        session["user_id"] = user["id"]
        session["username"] = user["username"]
        
        if request.is_json:
            return jsonify({"success": True, "redirect": url_for("index")})
        return redirect(url_for("index"))
    
    # If user is already logged in, redirect to chat interface
    if "user_id" in session:
        return redirect(url_for("index"))
    return render_template("login.html", tab="login")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        data = request.form if request.form else request.get_json(silent=True) or {}
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        confirm_password = data.get("confirm_password", "").strip()
        
        if password != confirm_password:
            error = "Passwords do not match."
            if request.is_json:
                return jsonify({"success": False, "error": error}), 400
            return render_template("login.html", error=error, tab="register")
        
        user_id, error = database.create_user(username, password)
        if error:
            if request.is_json:
                return jsonify({"success": False, "error": error}), 400
            return render_template("login.html", error=error, tab="register")
        
        # Auto-login after registration
        session.clear()
        session["user_id"] = user_id
        session["username"] = username
        
        if request.is_json:
            return jsonify({"success": True, "redirect": url_for("index")})
        return redirect(url_for("index"))
    
    return render_template("login.html", tab="register")

@app.route("/logout", methods=["GET", "POST"])
def logout():
    """
    Secure logout:
    Clears all server-side session data and invalidates the session cookie.
    """
    session.clear()
    response = redirect(url_for("login"))
    response.set_cookie("session", "", expires=0)
    return response

# ==========================================
# Main Dashboard & UI Route
# ==========================================

@app.route("/")
@login_required
def index():
    load_dotenv(override=True)
    user = database.get_user_by_id(session["user_id"])
    if not user:
        session.clear()
        return redirect(url_for("login"))
        
    has_api_key = bool(os.getenv("GROQ_API_KEY") and os.getenv("GROQ_API_KEY") != "your_groq_api_key_here")
    return render_template(
        "index.html",
        username=user["username"],
        models=AVAILABLE_MODELS,
        default_model=DEFAULT_MODEL,
        has_api_key=has_api_key
    )

# ==========================================
# Conversation Management API
# ==========================================

@app.route("/api/conversations", methods=["GET"])
@login_required
def list_conversations():
    conversations = database.get_user_conversations(session["user_id"])
    return jsonify({"conversations": conversations})

@app.route("/api/conversations/new", methods=["POST"])
@login_required
def new_conversation():
    data = request.get_json(silent=True) or {}
    title = data.get("title", "New Conversation")
    conv_id = database.create_conversation(session["user_id"], title=title)
    return jsonify({"conversation_id": conv_id, "title": title})

@app.route("/api/conversations/<conversation_id>", methods=["GET"])
@login_required
def get_conversation_details(conversation_id):
    messages = database.get_conversation_messages(session["user_id"], conversation_id)
    if messages is None:
        return jsonify({"error": "Conversation not found or unauthorized"}), 404
    return jsonify({"conversation_id": conversation_id, "messages": messages})

@app.route("/api/conversations/<conversation_id>", methods=["DELETE"])
@login_required
def delete_conversation_route(conversation_id):
    database.delete_conversation(session["user_id"], conversation_id)
    return jsonify({"success": True, "message": "Conversation deleted"})

@app.route("/api/conversations/<conversation_id>/title", methods=["PUT"])
@login_required
def update_title(conversation_id):
    data = request.get_json(silent=True) or {}
    new_title = data.get("title", "").strip()
    if not new_title:
        return jsonify({"error": "Title cannot be empty"}), 400
    database.update_conversation_title(session["user_id"], conversation_id, new_title)
    return jsonify({"success": True, "title": new_title})

@app.route("/api/user/wipe-data", methods=["POST"])
@login_required
def wipe_all_data():
    """
    Secure Data Destruction:
    Purges all case files, messages, and tactical records from the Batcomputer for this user.
    """
    database.wipe_user_data(session["user_id"])
    return jsonify({"success": True, "message": "All case files and tactical intelligence have been permanently erased from the Batcomputer."})

# ==========================================
# Real-Time Streaming Chat API (Groq)
# ==========================================

@app.route("/api/chat", methods=["POST"])
@login_required
def chat():
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()
    conversation_id = data.get("conversation_id")
    selected_model = data.get("model", DEFAULT_MODEL)
    
    if not user_message:
        return jsonify({"error": "Message content cannot be empty"}), 400
    
    # If no conversation_id provided, create a new conversation thread
    if not conversation_id:
        short_title = user_message[:28].strip() + ("..." if len(user_message) > 28 else "")
        title = f"CASE FILE // {short_title}"
        conversation_id = database.create_conversation(session["user_id"], title=title)
    else:
        # Verify ownership
        conv = database.get_conversation(session["user_id"], conversation_id)
        if not conv:
            return jsonify({"error": "Invalid conversation ID"}), 404
        # If conversation is still default title, rename to first user prompt
        if "New Mission" in conv["title"] or "Mission Intel" in conv["title"] or "New Conversation" in conv["title"]:
            short_title = user_message[:28].strip() + ("..." if len(user_message) > 28 else "")
            database.update_conversation_title(session["user_id"], conversation_id, f"CASE FILE // {short_title}")

    # Save user message to database
    database.add_message(conversation_id, sender="user", content=user_message)
    
    # Retrieve past context from database (last 12 messages)
    history = database.get_conversation_messages(session["user_id"], conversation_id) or []
    
    system_prompt = (
        "You are NEXUS AI // BATCOMPUTER, the ultra-advanced tactical artificial intelligence and command system "
        "operating from the Batcave and Wayne Enterprises tactical network. "
        "Your personality is hyper-intelligent, vigilant, precise, tactical, analytical, and disciplined. "
        "Address investigations, technical challenges, forensic audits, cybersecurity, scientific concepts, "
        "and strategic scenarios with utmost analytical depth and military precision. "
        "Format responses with tactical clarity, markdown headings, structured intelligence points, and syntax-highlighted code blocks."
    )
    
    # Format messages array for Groq
    groq_messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-12:]:
        role = "assistant" if msg["sender"] == "assistant" else "user"
        groq_messages.append({"role": role, "content": msg["content"]})
    
    client = get_groq_client()
    
    def generate_stream():
        accumulated_text = []
        
        # Send initial metadata chunk with conversation_id
        yield f"data: {json.dumps({'type': 'meta', 'conversation_id': conversation_id})}\n\n"
        
        # Case 1: Groq API Key is not configured
        if client is None:
            demo_response = (
                "Good evening, sir. The Wayne Enterprises neural link requires authorization.\n\n"
                "**Groq API Key Required:**\n"
                "1. Acquire an API key via [Groq Console](https://console.groq.com/keys).\n"
                "2. Register the key in the `.env` configuration file (`GROQ_API_KEY=gsk_...`).\n"
                "3. The Batcomputer will automatically interface with the neural core upon entry.\n\n"
                f"*Received transmission*: \"{user_message}\""
            )
            for word in demo_response.split(" "):
                chunk_data = json.dumps({"type": "chunk", "content": word + " "})
                yield f"data: {chunk_data}\n\n"
                accumulated_text.append(word + " ")
            
            # Save assistant response
            full_reply = "".join(accumulated_text)
            database.add_message(conversation_id, sender="assistant", content=full_reply)
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return
        
        # Case 2: Stream from Groq API
        try:
            try:
                stream = client.chat.completions.create(
                    model=selected_model,
                    messages=groq_messages,
                    temperature=0.7,
                    max_tokens=2048,
                    stream=True,
                )
            except Exception as model_err:
                # If model is not found, fallback to openai/gpt-oss-120b
                if "model_not_found" in str(model_err) or "does not exist" in str(model_err):
                    fallback_model = "openai/gpt-oss-120b"
                    stream = client.chat.completions.create(
                        model=fallback_model,
                        messages=groq_messages,
                        temperature=0.7,
                        max_tokens=2048,
                        stream=True,
                    )
                else:
                    raise model_err

            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    accumulated_text.append(token)
                    chunk_data = json.dumps({"type": "chunk", "content": token})
                    yield f"data: {chunk_data}\n\n"
            
            # Save complete response to database
            full_reply = "".join(accumulated_text)
            if full_reply.strip():
                database.add_message(conversation_id, sender="assistant", content=full_reply)
            
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            error_msg = f"\n\n❌ **Groq API Error**: {str(e)}"
            yield f"data: {json.dumps({'type': 'chunk', 'content': error_msg})}\n\n"
            database.add_message(conversation_id, sender="assistant", content="Error: " + str(e))
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return Response(
        stream_with_context(generate_stream()),
        content_type="text/event-stream"
    )

# ==========================================
# Run Server
# ==========================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print("==================================================")
    print(" [BATCOMPUTER] NEXUS AI // BATCOMPUTER ONLINE")
    print(" WAYNE ENTERPRISES // SECURE TACTICAL NETWORK")
    print(f" Terminal Interface: http://127.0.0.1:{port}")
    print("==================================================")
    app.run(host="0.0.0.0", port=port, debug=False)
