# Python Flask LAN File Sharing
A Python app designed for sharing files while on the same network. Especially useful when you are trying to get a file from one device to another.



## Features
- Easy to use Drag and Drop file upload.
- Faster than uploading to a server then downloading since you are the server.
- Works with large files (tested with >2gb).
- Preview and Download Files and Directories in Web Browser
- Cannot edit or delete file from Web Browser
- A folder will get zipped and downloaded as a zip file when downloading a directory



## How to use
0. Clone (or download as zip) this project from github
0. Open terminal (or command line) in project's folder.
0. pip install -r requirements.txt
0. Then run ```python .\main.py```.
0. On another device in the LAN, go to the url:port (Two file browsers will run simultaneously port80 and Port 81)



Project saves sent files in "uploads" foler. 



![Screenshot](https://raw.githubusercontent.com/zitlem/PFshare/master/uploads/Sample.jpg)

Credit to second file browser https://github.com/jakbin/filebrowser 