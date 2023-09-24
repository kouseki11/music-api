const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const musicTracks = require('./music.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Use express.json() for parsing JSON data

// Define a storage engine for multer
const storage = multer.diskStorage({
  destination: './var/task/uploads', // Define the destination folder for uploaded files
  filename: function (req, file, cb) {
    // Generate a unique filename with the .mp3 extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.mp3');
  },
});

// Initialize multer with the defined storage engine
const upload = multer({ storage: storage });



function saveMusicData() {
    const jsonData = JSON.stringify(musicTracks, null, 2);
  
    fs.writeFile('music.json', jsonData, (err) => {
      if (err) {
        console.error('Error saving music data:', err);
      } else {
        console.log('Music data saved to music.json');
      }
    });
  }
  

app.post('/api/music/tracks', upload.single('mp3'), (req, res) => {
  // Check if there's a file uploaded
  if (!req.file) {
    return res.status(400).json({ error: 'Invalid file upload' });
  }

  const newTrack = req.body;

  if (!newTrack || !newTrack.title) {
    // Delete the uploaded file if track data is invalid
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Invalid track data' });
  }

  // Generate a unique slug based on the track title
  const slug = newTrack.title.toLowerCase().replace(/\s+/g, '-');

  // Check if the generated slug already exists
  const existingTrack = musicTracks.find((track) => track.slug === slug);

  if (existingTrack) {
    // Delete the uploaded file if a track with the same title exists
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Track with this title already exists' });
  }

  newTrack.id = (musicTracks.length + 1).toString();
  newTrack.slug = slug;
  newTrack.mp3Url = req.file.path; // Store the path to the uploaded MP3 file

  musicTracks.push(newTrack);
  saveMusicData()

  res.status(201).json({ message: 'Track added', track: newTrack });
});

app.get('/api/music/tracks/:slug/mp3', (req, res) => {
    const slug = req.params.slug;
    const track = musicTracks.find((t) => t.slug === slug);
  
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
  
    // Send the MP3 file as a download attachment
    res.download(track.mp3Url, `${track.title}.mp3`, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to download the MP3 file' });
      }
    });
  });

// Other route handlers (GET, PUT, DELETE) remain the same

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
