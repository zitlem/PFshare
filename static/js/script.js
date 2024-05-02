
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
        //console.log("Response status: " + xhr.status);
        //console.log("Response text: " + xhr.responseText);
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            document.getElementById('upload-status').innerText = response.message;
            if (response.success) {
                // Wait for 2 seconds before refreshing the page
                setTimeout(function() {
                    window.location.reload();
                }, 500);
            }
        } else {
            document.getElementById('upload-status').innerText = 'An error occurred during the upload.';
        }
        document.getElementById('progress-bar').style.display = 'none';
    };

    xhr.send(formData);
}



function copyToClipboard() {
    //console.log("copyToClipboard function called");
    var button = document.querySelector('.clipboard-button-copy');
    var originalText = button.textContent; // Save the original text
    var text = document.getElementById("clipboard-text").value;

    // Attempt to use the Clipboard API
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
            //console.log('Text copied to clipboard');
            button.textContent = 'Copied'; // Replace button text with "Copied"
            setTimeout(function() {
                button.textContent = originalText; // Revert back to original text
            }, 5000); // Change back to original text after 5 seconds
        }).catch(function(err) {
            //console.error('Could not copy text using Clipboard API: ', err);
            // Fallback method
            fallbackCopyTextToClipboard(text, originalText);
        });
    } else {
        // Fallback method
        fallbackCopyTextToClipboard(text, originalText);
    }
}

function fallbackCopyTextToClipboard(text, originalText) {
    var button = document.querySelector('.clipboard-button-copy');

    var textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        //console.log('Fallback: Text copy ' + msg);
        
        // Replace the button text with "Copied"
        button.textContent = 'Copied';
        
        // Revert back to original text after 5 seconds
        setTimeout(function() {
            button.textContent = originalText; // Revert back to original text
        }, 5000); // Change back to original text after 5 seconds
    } catch (err) {
        //console.error('Fallback: Oops, unable to copy text: ', err);
    }

    document.body.removeChild(textArea);
}



function setClipboardText(text) {
    fetch('/set_clipboard_text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
    })
    .then(response => response.json())
    .then(data => {
        //console.log(data.message);
    })
    .catch(error => {
        //console.error('Error setting clipboard text:', error);
    });
}




function getClipboardText() {
    fetch('/get_clipboard_text')
    .then(response => response.json())
    .then(data => {
       // console.log('Clipboard text:', data.text);
        // Use the clipboard text as needed
    })
    .catch(error => {
        //console.error('Error getting clipboard text:', error);
    });
}

function clearClipboardText() {
    document.getElementById("clipboard-text").value = ''; // Clear the text area
	updateClipboardText();
}

