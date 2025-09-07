#!/usr/bin/env python3
"""
Lightweight Flask File Server with Web Interface
Features: File browsing, uploading, downloading, admin/viewer modes, real-time updates
"""

import os
import json
import shutil
import zipfile
import mimetypes
from datetime import datetime
from pathlib import Path
import tempfile
from functools import wraps
import secrets

from flask import Flask, render_template, request, jsonify, send_file, session, redirect, url_for, flash
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size
app.config['JSON_AS_ASCII'] = False  # Enable proper Unicode handling in JSON responses

# Configuration
ADMIN_PASSWORD = "admin123"  # Change this in production
BASE_DIR = os.path.abspath("./files")  # Directory to serve files from
ALLOWED_EXTENSIONS = set()  # Empty set means all extensions allowed
CONFIG_FILE = "config.json"  # Configuration file for persistent data

# Create base directory if it doesn't exist
os.makedirs(BASE_DIR, exist_ok=True)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables for undo functionality and shared text
last_operation = None

def load_config():
    """Load configuration from file"""
    default_config = {
        "shared_text": "Welcome"
    }
    
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8-sig') as f:
                loaded_config = json.load(f)
                print(f"Loaded config from {CONFIG_FILE}: {loaded_config}")
                return loaded_config
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading config: {e}")
            pass
    else:
        print(f"Config file {CONFIG_FILE} not found, using defaults")
    
    return default_config

def save_config(config):
    """Save configuration to file"""
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8-sig') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        print(f"Config saved to {CONFIG_FILE}: {config}")
    except IOError as e:
        print(f"Warning: Failed to save config: {e}")
        return False
    return True

# Load initial configuration
config = load_config()
shared_text_content = {"content": config.get("shared_text", "")}
print(f"Initial shared text content: {shared_text_content}")

# Ensure config file exists with current data
if not os.path.exists(CONFIG_FILE):
    print("Creating initial config file...")
    save_config(config)

def get_file_size(path):
    """Get file or directory size in bytes"""
    if os.path.isfile(path):
        return os.path.getsize(path)
    elif os.path.isdir(path):
        total = 0
        for dirpath, dirnames, filenames in os.walk(path):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                try:
                    total += os.path.getsize(filepath)
                except (OSError, IOError):
                    pass
        return total
    return 0

def format_file_size(size_bytes):
    """Convert bytes to human readable format"""
    if size_bytes == 0:
        return "0 B"
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    return f"{size_bytes:.1f} {size_names[i]}"

def get_file_icon(filename):
    """Get appropriate icon class for file type"""
    ext = os.path.splitext(filename)[1].lower()
    icon_map = {
        # Images
        '.jpg': 'fas fa-image', '.jpeg': 'fas fa-image', '.png': 'fas fa-image',
        '.gif': 'fas fa-image', '.bmp': 'fas fa-image', '.svg': 'fas fa-image',
        # Videos
        '.mp4': 'fas fa-video', '.avi': 'fas fa-video', '.mkv': 'fas fa-video',
        '.mov': 'fas fa-video', '.wmv': 'fas fa-video', '.flv': 'fas fa-video',
        # Audio
        '.mp3': 'fas fa-music', '.wav': 'fas fa-music', '.flac': 'fas fa-music',
        '.aac': 'fas fa-music', '.ogg': 'fas fa-music',
        # Documents
        '.pdf': 'fas fa-file-pdf', '.doc': 'fas fa-file-word', '.docx': 'fas fa-file-word',
        '.xls': 'fas fa-file-excel', '.xlsx': 'fas fa-file-excel',
        '.ppt': 'fas fa-file-powerpoint', '.pptx': 'fas fa-file-powerpoint',
        '.txt': 'fas fa-file-alt', '.md': 'fas fa-file-alt', '.rtf': 'fas fa-file-alt',
        # Code
        '.py': 'fas fa-file-code', '.js': 'fas fa-file-code', '.html': 'fas fa-file-code',
        '.css': 'fas fa-file-code', '.php': 'fas fa-file-code', '.cpp': 'fas fa-file-code',
        '.java': 'fas fa-file-code', '.c': 'fas fa-file-code',
        # Archives
        '.zip': 'fas fa-file-archive', '.rar': 'fas fa-file-archive', '.7z': 'fas fa-file-archive',
        '.tar': 'fas fa-file-archive', '.gz': 'fas fa-file-archive',
    }
    return icon_map.get(ext, 'fas fa-file')

def is_admin():
    """Check if current user is admin"""
    return session.get('admin', False)

def admin_required(f):
    """Decorator for admin-only routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def safe_join(directory, filename):
    """Safely join directory and filename to prevent path traversal"""
    return os.path.abspath(os.path.join(directory, filename))

def is_safe_path(path, base_path):
    """Check if path is within base directory"""
    return os.path.commonpath([path, base_path]) == base_path

@app.route('/')
def index():
    """Main file browser page"""
    current_path = request.args.get('path', '')
    search_query = request.args.get('search', '')
    
    # Security check
    full_path = safe_join(BASE_DIR, current_path)
    if not is_safe_path(full_path, BASE_DIR):
        return redirect(url_for('index'))
    
    if not os.path.exists(full_path):
        return redirect(url_for('index'))
    
    # Get directory contents
    items = []
    if os.path.isdir(full_path):
        try:
            for item in os.listdir(full_path):
                if search_query and search_query.lower() not in item.lower():
                    continue
                    
                item_path = os.path.join(full_path, item)
                is_dir = os.path.isdir(item_path)
                size = get_file_size(item_path)
                modified = datetime.fromtimestamp(os.path.getmtime(item_path))
                
                items.append({
                    'name': item,
                    'is_dir': is_dir,
                    'size': size,
                    'size_formatted': format_file_size(size),
                    'modified': modified.strftime('%Y-%m-%d %H:%M:%S'),
                    'icon': 'fas fa-folder' if is_dir else get_file_icon(item),
                    'path': os.path.join(current_path, item).replace('\\', '/')
                })
        except PermissionError:
            flash('Permission denied accessing this directory', 'error')
            return redirect(url_for('index'))
    
    # Sort items (directories first, then by name)
    sort_by = request.args.get('sort', 'name')
    reverse = request.args.get('order') == 'desc'
    
    if sort_by == 'size':
        items.sort(key=lambda x: (not x['is_dir'], x['size']), reverse=reverse)
    elif sort_by == 'modified':
        items.sort(key=lambda x: (not x['is_dir'], x['modified']), reverse=reverse)
    else:  # name
        items.sort(key=lambda x: (not x['is_dir'], x['name'].lower()), reverse=reverse)
    
    # Breadcrumb navigation
    breadcrumbs = []
    if current_path:
        parts = current_path.split('/')
        path = ''
        for part in parts:
            if part:
                path = os.path.join(path, part).replace('\\', '/')
                breadcrumbs.append({'name': part, 'path': path})
    
    return render_template('index.html', 
                         items=items, 
                         current_path=current_path,
                         breadcrumbs=breadcrumbs,
                         is_admin=is_admin(),
                         search_query=search_query,
                         sort_by=sort_by,
                         order=request.args.get('order', 'asc'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Admin login page"""
    if request.method == 'POST':
        password = request.form.get('password')
        if password == ADMIN_PASSWORD:
            session['admin'] = True
            flash('Logged in as admin', 'success')
            return redirect(request.args.get('next') or url_for('index'))
        else:
            flash('Invalid password', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Logout and return to viewer mode"""
    session.pop('admin', None)
    flash('Logged out', 'info')
    return redirect(url_for('index'))

@app.route('/upload', methods=['POST'])
def upload_files():
    """Handle file uploads"""
    global last_operation
    
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    current_path = request.form.get('path', '')
    
    # Security check
    upload_dir = safe_join(BASE_DIR, current_path)
    if not is_safe_path(upload_dir, BASE_DIR):
        return jsonify({'error': 'Invalid path'}), 400
    
    if not os.path.exists(upload_dir):
        return jsonify({'error': 'Directory does not exist'}), 400
    
    uploaded_files = []
    for file in files:
        if file.filename == '':
            continue
        
        # Handle Unicode filenames properly
        original_filename = file.filename
        filename = secure_filename(original_filename)
        
        # If secure_filename stripped all characters (e.g., Cyrillic), use a fallback
        if not filename:
            import uuid
            ext = os.path.splitext(original_filename)[1] if original_filename else '.txt'
            filename = f"upload_{uuid.uuid4().hex[:8]}{ext}"
        elif filename != original_filename:
            # Try to preserve original filename if it's safe
            try:
                # Check if original filename is safe for filesystem
                test_path = os.path.join(upload_dir, original_filename)
                os.path.normpath(test_path)  # This will raise an exception for unsafe paths
                if os.path.commonpath([test_path, upload_dir]) == upload_dir:
                    filename = original_filename
            except (ValueError, OSError):
                pass  # Use the secure filename
        
        file_path = os.path.join(upload_dir, filename)
        
        # Handle duplicate filenames
        counter = 1
        original_name = filename
        while os.path.exists(file_path):
            name, ext = os.path.splitext(original_name)
            filename = f"{name}_{counter}{ext}"
            file_path = os.path.join(upload_dir, filename)
            counter += 1
        
        try:
            file.save(file_path)
            uploaded_files.append(filename)
        except Exception as e:
            return jsonify({'error': f'Failed to save {filename}: {str(e)}'}), 500
    
    # Store operation for undo
    last_operation = {
        'type': 'upload',
        'files': [os.path.join(upload_dir, f) for f in uploaded_files],
        'timestamp': datetime.now()
    }
    
    # Emit update to all clients
    socketio.emit('file_updated', {'path': current_path}, room='file_browser')
    
    return jsonify({'success': True, 'uploaded': uploaded_files})

@app.route('/download')
def download_file():
    """Download a single file"""
    file_path = request.args.get('path', '')
    
    # Security check
    full_path = safe_join(BASE_DIR, file_path)
    if not is_safe_path(full_path, BASE_DIR):
        return jsonify({'error': 'Invalid path'}), 400
    
    if not os.path.exists(full_path):
        return jsonify({'error': 'File not found'}), 404
    
    if os.path.isfile(full_path):
        return send_file(full_path, as_attachment=True)
    else:
        return jsonify({'error': 'Path is not a file'}), 400

@app.route('/download_folder')
def download_folder():
    """Download a folder as ZIP"""
    folder_path = request.args.get('path', '')
    
    # Security check
    full_path = safe_join(BASE_DIR, folder_path)
    if not is_safe_path(full_path, BASE_DIR):
        return jsonify({'error': 'Invalid path'}), 400
    
    if not os.path.exists(full_path) or not os.path.isdir(full_path):
        return jsonify({'error': 'Folder not found'}), 404
    
    # Create temporary zip file
    temp_dir = tempfile.mkdtemp()
    folder_name = os.path.basename(full_path) or 'files'
    zip_path = os.path.join(temp_dir, f"{folder_name}.zip")
    
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(full_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arc_name = os.path.relpath(file_path, full_path)
                    zipf.write(file_path, arc_name)
        
        return send_file(zip_path, as_attachment=True, download_name=f"{folder_name}.zip")
    except Exception as e:
        return jsonify({'error': f'Failed to create ZIP: {str(e)}'}), 500

@app.route('/create_folder', methods=['POST'])
@admin_required
def create_folder():
    """Create a new folder"""
    global last_operation
    
    data = request.get_json()
    current_path = data.get('path', '')
    folder_name = data.get('name', '').strip()
    
    if not folder_name:
        return jsonify({'error': 'Folder name required'}), 400
    
    # Security check
    parent_dir = safe_join(BASE_DIR, current_path)
    if not is_safe_path(parent_dir, BASE_DIR):
        return jsonify({'error': 'Invalid path'}), 400
    
    folder_name = secure_filename(folder_name)
    new_folder_path = os.path.join(parent_dir, folder_name)
    
    if os.path.exists(new_folder_path):
        return jsonify({'error': 'Folder already exists'}), 400
    
    try:
        os.makedirs(new_folder_path)
        
        # Store operation for undo
        last_operation = {
            'type': 'create_folder',
            'path': new_folder_path,
            'timestamp': datetime.now()
        }
        
        # Emit update to all clients
        socketio.emit('file_updated', {'path': current_path}, room='file_browser')
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': f'Failed to create folder: {str(e)}'}), 500

@app.route('/delete', methods=['POST'])
@admin_required
def delete_item():
    """Delete a file or folder"""
    global last_operation
    
    data = request.get_json()
    item_path = data.get('path', '')
    
    # Security check
    full_path = safe_join(BASE_DIR, item_path)
    if not is_safe_path(full_path, BASE_DIR):
        return jsonify({'error': 'Invalid path'}), 400
    
    if not os.path.exists(full_path):
        return jsonify({'error': 'Item not found'}), 404
    
    # Create backup for undo
    backup_path = None
    if os.path.isfile(full_path):
        backup_dir = tempfile.mkdtemp()
        backup_path = os.path.join(backup_dir, os.path.basename(full_path))
        shutil.copy2(full_path, backup_path)
    elif os.path.isdir(full_path):
        backup_dir = tempfile.mkdtemp()
        backup_path = os.path.join(backup_dir, os.path.basename(full_path))
        shutil.copytree(full_path, backup_path)
    
    try:
        if os.path.isfile(full_path):
            os.remove(full_path)
        else:
            shutil.rmtree(full_path)
        
        # Store operation for undo
        last_operation = {
            'type': 'delete',
            'original_path': full_path,
            'backup_path': backup_path,
            'timestamp': datetime.now()
        }
        
        # Emit update to all clients
        current_dir = os.path.dirname(item_path)
        socketio.emit('file_updated', {'path': current_dir}, room='file_browser')
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': f'Failed to delete: {str(e)}'}), 500

@app.route('/rename', methods=['POST'])
@admin_required
def rename_item():
    """Rename a file or folder"""
    global last_operation
    
    data = request.get_json()
    old_path = data.get('path', '')
    new_name = data.get('name', '').strip()
    
    if not new_name:
        return jsonify({'error': 'New name required'}), 400
    
    # Security check
    full_old_path = safe_join(BASE_DIR, old_path)
    if not is_safe_path(full_old_path, BASE_DIR):
        return jsonify({'error': 'Invalid path'}), 400
    
    if not os.path.exists(full_old_path):
        return jsonify({'error': 'Item not found'}), 404
    
    new_name = secure_filename(new_name)
    parent_dir = os.path.dirname(full_old_path)
    new_full_path = os.path.join(parent_dir, new_name)
    
    if os.path.exists(new_full_path):
        return jsonify({'error': 'Name already exists'}), 400
    
    try:
        os.rename(full_old_path, new_full_path)
        
        # Store operation for undo
        last_operation = {
            'type': 'rename',
            'old_path': full_old_path,
            'new_path': new_full_path,
            'timestamp': datetime.now()
        }
        
        # Emit update to all clients
        current_dir = os.path.dirname(old_path)
        socketio.emit('file_updated', {'path': current_dir}, room='file_browser')
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': f'Failed to rename: {str(e)}'}), 500

@app.route('/undo', methods=['POST'])
@admin_required
def undo_last_action():
    """Undo the last file operation"""
    global last_operation
    
    if not last_operation:
        return jsonify({'error': 'No operation to undo'}), 400
    
    try:
        op_type = last_operation['type']
        
        if op_type == 'upload':
            # Delete uploaded files
            for file_path in last_operation['files']:
                if os.path.exists(file_path):
                    os.remove(file_path)
        
        elif op_type == 'create_folder':
            # Remove created folder
            if os.path.exists(last_operation['path']):
                os.rmdir(last_operation['path'])
        
        elif op_type == 'delete':
            # Restore from backup
            if last_operation['backup_path'] and os.path.exists(last_operation['backup_path']):
                if os.path.isfile(last_operation['backup_path']):
                    shutil.copy2(last_operation['backup_path'], last_operation['original_path'])
                else:
                    shutil.copytree(last_operation['backup_path'], last_operation['original_path'])
        
        elif op_type == 'rename':
            # Restore original name
            if os.path.exists(last_operation['new_path']):
                os.rename(last_operation['new_path'], last_operation['old_path'])
        
        # Clear last operation
        last_operation = None
        
        # Emit update to all clients
        socketio.emit('file_updated', {'path': ''}, room='file_browser')
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': f'Failed to undo: {str(e)}'}), 500

@app.route('/preview')
def preview_file():
    """Preview a text file"""
    file_path = request.args.get('path', '')
    
    # Security check
    full_path = safe_join(BASE_DIR, file_path)
    if not is_safe_path(full_path, BASE_DIR):
        return jsonify({'error': 'Invalid path'}), 400
    
    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        return jsonify({'error': 'File not found'}), 404
    
    try:
        # Check if file is text
        mimetype, _ = mimetypes.guess_type(full_path)
        if mimetype and not mimetype.startswith('text/'):
            return jsonify({'error': 'File is not a text file'}), 400
        
        with open(full_path, 'r', encoding='utf-8-sig', errors='replace') as f:
            content = f.read(10000)  # Limit to first 10KB
        
        return jsonify({'success': True, 'content': content})
    except Exception as e:
        return jsonify({'error': f'Failed to read file: {str(e)}'}), 500

@app.route('/shared_text')
def get_shared_text():
    """Get shared text content"""
    return jsonify(shared_text_content)

@app.route('/shared_text', methods=['POST'])
def update_shared_text():
    """Update shared text content"""
    global shared_text_content, config
    
    data = request.get_json()
    content = data.get('content', '')
    
    shared_text_content['content'] = content
    
    # Save to config file for persistence
    config['shared_text'] = content
    success = save_config(config)
    
    if success:
        print(f"Shared text updated and saved: {content[:50]}...")
    else:
        print("Failed to save shared text to config file")
    
    # Emit update to all clients
    socketio.emit('shared_text_updated', shared_text_content, room='shared_text')
    
    return jsonify({'success': True})

# SocketIO events
@socketio.on('connect')
def on_connect():
    """Handle client connection"""
    join_room('file_browser')
    join_room('shared_text')

@socketio.on('disconnect')
def on_disconnect():
    """Handle client disconnection"""
    leave_room('file_browser')
    leave_room('shared_text')

if __name__ == '__main__':
    print(f"Starting Flask File Server...")
    print(f"Serving files from: {BASE_DIR}")
    print(f"Admin password: {ADMIN_PASSWORD}")
    print(f"Access the server at: http://localhost:80")
    
    socketio.run(app, host='0.0.0.0', port=80, debug=False)