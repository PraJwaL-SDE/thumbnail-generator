const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Set up multer for handling file uploads
const upload = multer({
  dest: 'uploads/' // Temporary directory for storing uploaded files
});

// Endpoint to upload video and return the first frame
app.post('/video/thumbnail', upload.single('video'), (req, res) => {
  const videoPath = req.file.path; // Path to the uploaded video
  const outputPath = path.join(__dirname, 'output', `${Date.now()}_frame.jpg`);

  // Ensure the output directory exists
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  // Extract the first frame using ffmpeg
  ffmpeg(videoPath)
    .screenshots({
      timestamps: ['00:00:01.000'], // Timestamp for the frame (1 second in)
      filename: path.basename(outputPath),
      folder: path.dirname(outputPath)
    })
    .on('end', () => {
      // Read the image and send it back as a response
      fs.readFile(outputPath, (err, data) => {
        if (err) {
          console.error('Error reading the frame:', err);
          return res.status(500).send('Error processing the video.');
        }

        // Send the image as a response
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(data);

        // Clean up temporary files
        fs.unlinkSync(videoPath);
        fs.unlinkSync(outputPath);
      });
    })
    .on('error', (err) => {
      console.error('Error processing video with ffmpeg:', err);
      res.status(500).send('Error processing the video.');

      // Clean up temporary files
      fs.unlinkSync(videoPath);
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
