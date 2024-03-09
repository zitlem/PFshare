function uploadFile() {
    var fileInput = document.getElementById('file-input');
    var currentPathInput = document.getElementById('current-path');
    var file = fileInput.files[0];
    var formData = new FormData();
    formData.append('file', file);
    if (currentPathInput) {
        formData.append('current_path', currentPathInput.value);
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/', true);

    xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
            var percentComplete = (e.loaded / e.total) * 100;
            var progressBar = document.getElementById('progress-bar');
            progressBar.style.width = percentComplete + '%';
            progressBar.textContent = Math.round(percentComplete) + '%';
            progressBar.style.display = 'block';
        }
    };

xhr.onload = function() {
    //console.log("Response status: " + xhr.status);
    //console.log("Response text: " + xhr.responseText);
    if (xhr.status === 200) {
        var response = JSON.parse(xhr.responseText);
        document.getElementById('upload-status').innerText = response.message;
        if (response.success) {
            // Assuming the response includes the file's name and URL
            var fileList = document.getElementById('file-list');
            var newFile = document.createElement('li');
            var fileLink = document.createElement('a');
            fileLink.href = response.fileUrl; // Make sure your response includes the URL
            fileLink.textContent = response.fileName; // And the file name
            newFile.appendChild(fileLink);
            fileList.appendChild(newFile);

            // Optionally, clear the file input for the next upload
            document.getElementById('file-input').value = '';
        }
    } else {
        document.getElementById('upload-status').innerText = 'An error occurred during the upload.';
    }
    document.getElementById('progress-bar').style.display = 'none';
};


    xhr.send(formData);
}

function previewFile(fileUrl, fileName) {
    // Encode the fileUrl for use in web URLs
    var encodedFileUrl = encodeURIComponent(fileUrl);
    //console.log("Previewing file:", fileName, "URL:", fileUrl);
    let fileNameLower = fileName.toLowerCase();

    // Image file types
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tif', '.tiff'];
    // Video file types
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.ogv', '.3gp'];
    // Audio file types
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac'];
    // Text file types
    const textExtensions = ['.txt', '.md', '.log', '.json', '.xml', '.csv', '.html', '.css', '.js', '.ini', '.yaml', '.yml', '.conf', '.py', '.php', '.rb', '.sql', '.sh', '.bat', '.ps1', '.tex', '.rtf', '.plist', '.vbs'];

    if (imageExtensions.some(ext => fileNameLower.endsWith(ext))) {
        var imgTab = window.open("", "_blank");
        imgTab.document.write('<style>body{margin:0;display:flex;justify-content:center;align-items:center;overflow:hidden;}img{max-width:100%;max-height:100vh;}</style>');
        imgTab.document.write('<img src="' + fileUrl + '" alt="Image Preview">');
    } else if (videoExtensions.some(ext => fileNameLower.endsWith(ext))) {
        var videoTab = window.open("", "_blank");
        videoTab.document.write('<style>body{margin:0;display:flex;justify-content:center;align-items:center;overflow:hidden;}video{max-width:100%;max-height:100vh;}</style>');
        videoTab.document.write('<video controls autoplay><source src="' + fileUrl + '" type="video/' + fileNameLower.split('.').pop() + '">Your browser does not support the video tag.</video>');
    } else if (audioExtensions.some(ext => fileNameLower.endsWith(ext))) {
		var audioWindow = window.open("", "_blank");
		audioWindow.document.write('<style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;overflow:hidden;}</style>');
		audioWindow.document.write('<audio controls autoplay style="max-width:100%;"><source src="' + fileUrl + '" type="audio/' + fileNameLower.split('.').pop() + '">Your browser does not support the audio element.</audio>');
				
    } else if (textExtensions.some(ext => fileNameLower.endsWith(ext))) {
        var textTab = window.open("", "_blank");
        fetch(fileUrl)
            .then(response => response.text())
            .then(text => {
                textTab.document.write('<pre style="margin:0; padding:20px; height:98vh; overflow:auto;">' + text + '</pre>');
            });
    } else {
        alert('Preview not available for this file type.');
    }
}

    function downloadFile(fileUrl) {
			//console.log("Downloading file:", fileUrl, "URL:", fileUrl);
        window.location.href = fileUrl;
    }

	
window.addEventListener('load', function() {
    // Attach event listeners to the document for drag and drop functionality
    document.addEventListener('dragover', handleDragOver, false);
    document.addEventListener('drop', handleFileSelect, false);
});

function handleDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function handleFileSelect(event) {
    event.stopPropagation();
    event.preventDefault();
    var files = event.dataTransfer.files; // FileList object.

    // files is a FileList of File objects. List some properties.
    for (var i = 0, f; f = files[i]; i++) {
        uploadFile(f);
    }
}

function uploadFile(file) {
    var formData = new FormData();
    formData.append('file', file);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/', true);

    xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
            var percentComplete = (e.loaded / e.total) * 100;
            var progressBar = document.getElementById('progress-bar');
            progressBar.style.width = percentComplete + '%';
            progressBar.textContent = Math.round(percentComplete) + '%';
            progressBar.style.display = 'block';
        }
    };

    xhr.onload = function() {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            document.getElementById('upload-status').innerText = response.message;
            if (response.success) {
                setTimeout(function() {
                    window.location.reload(true); 
                }, 1500); 
            }
        } else {
            document.getElementById('upload-status').innerText = 'An error occurred during the upload.';
        }
        document.getElementById('progress-bar').style.display = 'none';
    };

    xhr.send(formData);
}