from flask import Flask, request, send_from_directory, render_template, jsonify
import os
import werkzeug
import shutil
from flask import send_file
from flask_socketio import SocketIO, emit
import sqlite3

from pathlib import Path
from jfb import server

import threading
import multiprocessing
import time


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

# Function to create the database table if it doesn't exist
def create_table():
    conn = sqlite3.connect('clipboard.db')
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS clipboard (id INTEGER PRIMARY KEY, text TEXT)''')
    conn.commit()
    conn.close()

# Create the table on application startup
create_table()
    
    # Function to get the clipboard text from the database
def get_clipboard_text():
    conn = sqlite3.connect('clipboard.db')
    cursor = conn.cursor()
    cursor.execute('SELECT text FROM clipboard ORDER BY id DESC LIMIT 1')
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else ""

# Function to set the clipboard text in the database
def set_clipboard_text(text):
    conn = sqlite3.connect('clipboard.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO clipboard (text) VALUES (?)', (text,))
    conn.commit()
    conn.close()



@socketio.on('connect')
def handle_connect():
    # Send current clipboard text to newly connected client
    text = get_clipboard_text()
    emit('clipboard_text', {'text': text})

@socketio.on('update_clipboard_text')
def handle_update_clipboard_text(data):
    text = data['text']
    set_clipboard_text(text)
    emit('clipboard_text', {'text': text}, broadcast=True)






# Directory where uploaded files will be stored
BASE_DIR = 'uploads'
app.config['UPLOAD_FOLDER'] = BASE_DIR

# Ensure the upload folder exists
os.makedirs(BASE_DIR, exist_ok=True)

# Custom filter to get dirname
def dirname_filter(path):
    return os.path.dirname(path)

app.jinja_env.filters['dirname'] = dirname_filter


def list_files_and_dirs(directory):
    items = []
    print("Listing files and directories in:", directory)  # Add this line for debugging
    for filename in os.listdir(directory):
        # Skip hidden files and directories
        if filename.startswith('.'):
            continue

        item_path = os.path.join(directory, filename)
        item = {
            'name': filename,
            'is_dir': os.path.isdir(item_path),
            'path': os.path.relpath(item_path, BASE_DIR)
        }
        items.append(item)
    return items



@app.route('/download_directory/<path:dir_path>')
def download_directory(dir_path):
    # Make sure the directory exists
    directory = os.path.join(BASE_DIR, dir_path)
    if not os.path.exists(directory):
        return "Directory not found", 404

    # Define the base path for the ZIP file without the .zip extension
    zip_base_path = os.path.join(BASE_DIR, dir_path)
    
    # Create a ZIP file (the .zip extension will be added automatically)
    shutil.make_archive(zip_base_path, 'zip', directory)

    # The actual path of the created ZIP file
    zip_file_path = zip_base_path + '.zip'

    # Send the ZIP file
    return send_file(zip_file_path, as_attachment=True)




@app.route('/favicon.ico')
def favicon():
    return ('', 404)



@app.route('/', defaults={'path': ''}, methods=['GET', 'POST'])
@app.route('/<path:path>', methods=['GET', 'POST'])
def index(path):
    upload_folder = os.path.join(BASE_DIR, path)

    if request.method == 'POST':
        # Retrieve the current path from the form data
        current_path = request.form.get('current_path', '')
        upload_folder = os.path.join(BASE_DIR, current_path)

        if 'file' not in request.files:
            print("No file part in the request")
            return jsonify({'message': 'No file part', 'success': False})
        
        file = request.files['file']
        if file.filename == '':
            print("No selected file")
            return jsonify({'message': 'No selected file', 'success': False})

        if file:
            filename = werkzeug.utils.secure_filename(file.filename)
            file_path = os.path.join(upload_folder, filename)
            try:
                file.save(file_path)
                return jsonify({'message': 'File uploaded successfully', 'success': True})

            except Exception as e:
                print(f"Error saving file: {e}")
                return jsonify({'message': 'Error saving file', 'success': False})

    # List files and directories
    items = list_files_and_dirs(upload_folder)
    return render_template('index.html', items=items, path=path)



@app.route('/downloads/<path:filename>')
def download_file(filename):
    # Normalize the file path
    normalized_filename = filename.replace('\\', '/')
    return send_from_directory(BASE_DIR, normalized_filename, as_attachment=True)

    
def run_server(address, port, path):
    server(address, port, path)   

def main():
    return run_server("0.0.0.0", 81, Path.cwd() / 'uploads')
    

def server1():
    socketio.run(app, host='0.0.0.0', port=80)

def server2():
    raise SystemExit(main())

    

if __name__ == "__main__":
    # Create multiprocessing processes
    p1 = multiprocessing.Process(target=server1)
    p2 = multiprocessing.Process(target=server2)

    # Start processes
    p1.start()
    p2.start()

    # Wait for both processes to finish
    p1.join()
    p2.join()