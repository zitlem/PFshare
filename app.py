from flask import Flask, request, send_from_directory, render_template, jsonify
import os
import werkzeug
import shutil
from flask import send_file

app = Flask(__name__)
#app.debug = True  # Enable debug mode

# Directory where uploaded files will be stored
BASE_DIR = 'uploads'
app.config['UPLOAD_FOLDER'] = BASE_DIR

# Ensure the upload folder exists
os.makedirs(BASE_DIR, exist_ok=True)

# Custom filter to get dirname
def dirname_filter(path):
    return os.path.dirname(path)

app.jinja_env.filters['dirname'] = dirname_filter

# Function to list files and directories
def list_files_and_dirs(directory):
    items = []
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

    
    
    

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)
