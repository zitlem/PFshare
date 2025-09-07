# PF File Server

A modern, lightweight Flask-based file server with a beautiful glass morphism interface, real-time collaboration features, and comprehensive file management capabilities.

## Features

### 🌟 **Modern Glass Morphism UI**
- Stunning animated gradient backgrounds (light grey and dark blue themes)
- Ultra-transparent glass-like containers with backdrop blur effects
- Smooth animations and hover effects
- Responsive design that works on all devices
- Dark/Light theme toggle with system preference detection

### 📁 **File Management**
- Browse files and folders with intuitive navigation
- Upload files via drag-and-drop or click-to-upload (works anywhere on the page)
- Download individual files or entire folders as ZIP archives
- File preview for images, videos, audio, and text files
- Create new folders
- Rename and delete files/folders (admin only)
- Search functionality to find files quickly
- Sortable file list (by name, size, or date modified)

### 👥 **Real-Time Collaboration**
- **Shared Clipboard**: Real-time text sharing between all connected users
- Text formatting options (UPPER, lower, Title Case, Clear)
- Copy to clipboard functionality
- Instant synchronization across all clients using WebSocket
- Persistent storage - shared text survives server restarts

### 🔐 **Access Control**
- Admin mode with configurable password
- Guest users can browse and upload files
- Admin users get additional permissions (create folders, rename, delete, undo)
- Session-based authentication

### ⚡ **Advanced Features**
- Real-time file system updates via WebSocket
- Undo functionality for file operations
- Progress tracking for file uploads
- Context menus for quick actions
- Download queue with status tracking
- Comprehensive Unicode support 
- Mobile-responsive design

## Installation

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Quick Start

1. **Run the server**
   ```bash
   python pfshare.py
   ```

2. **Access the server**
   - Open your browser and go to `http://localhost:80`
   - Or access from other devices on your network using your computer's IP address

## Configuration

### Admin Password
The default admin password is `admin123`. Change it in `pfshare.py`:
```python
ADMIN_PASSWORD = "your_secure_password_here"
```

### Server Settings
- **Port**: Default is 80 (standard HTTP port)
- **Host**: Binds to all interfaces (`0.0.0.0`) for network access
- **File Directory**: Files are served from the `./files` directory
- **Max Upload Size**: 500MB per file

### File Storage
- Files are stored in the `./files` directory (created automatically)
- Shared text is persisted in `config.json`
- Configuration survives server restarts

## Usage

### For Everyone (Guests)
- **Browse files**: Click folders to navigate, click files to download
- **Upload files**: Drag and drop files anywhere on the page, or click the Upload button
- **Preview files**: Click the eye icon to preview images, videos, audio, and text files
- **Search**: Use the search box to find files by name
- **Shared Clipboard**: Use the shared text area to communicate with other users
- **Theme**: Toggle between light and dark themes

### For Admins
- **Login**: Click "Admin Login" and enter the password
- **Create folders**: Use the "New Folder" button
- **Rename/Delete**: Right-click on files/folders or use the action buttons
- **Undo**: Undo the last file operation
- **Full access**: All guest features plus management capabilities

### Keyboard Shortcuts
- **Ctrl+U**: Quick upload (admin/guests)
- **Ctrl+N**: New folder (admin only)
- **Escape**: Close modals and context menus

## Technical Details

### Architecture
- **Backend**: Flask with Socket.IO for real-time communication
- **Frontend**: Vanilla JavaScript with modern CSS (no frameworks)
- **Storage**: File system + JSON configuration
- **Real-time**: WebSocket connections for live updates

### Browser Compatibility
- Chrome/Chromium 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Security Features
- Path traversal protection
- Filename sanitization
- Session-based authentication
- CSRF protection via Flask
- Configurable access controls

## File Support

### Preview Support
- **Images**: JPG, PNG, GIF, BMP, SVG, WebP
- **Videos**: MP4, AVI, MKV, MOV, WMV, WebM
- **Audio**: MP3, WAV, FLAC, AAC, OGG, M4A
- **Text**: TXT, MD, RTF, and other text-based files
- **Code**: Python, JavaScript, HTML, CSS, and more

### Upload Support
- No file type restrictions (configurable)
- Automatic duplicate handling
- Unicode filename support
- Drag-and-drop from file explorer

## Development

### Project Structure
```
pf/
├── pfshare.py          # Main Flask application
├── templates/
│   └── index.html      # Main web interface
├── files/              # File storage directory (auto-created)
├── config.json         # Configuration storage (auto-created)
└── README.md          # This file
```

### Customization
The interface is highly customizable through CSS variables and can be easily themed or modified to match your needs.

## Troubleshooting

### Common Issues

**Port 80 already in use**
- Change the port in `pfshare.py`: `socketio.run(app, host='0.0.0.0', port=8080)`
- Access via `http://localhost:8080`

**Permission denied on port 80**
- On Linux/Mac, run with sudo: `sudo python pfshare.py`
- Or use a higher port number (8080, 5000, etc.)

**Files not uploading**
- Check file size (max 500MB)
- Ensure the `files` directory exists and is writable
- Check browser console for error messages

**Can't access from other devices**
- Make sure your firewall allows connections on the chosen port
- Use your computer's actual IP address, not localhost
- Ensure the server is binding to `0.0.0.0`, not `127.0.0.1`

## License

This project is open source. Feel free to use, modify, and distribute as needed.