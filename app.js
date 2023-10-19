const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const musicTracks = require('./music.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Use express.json() for parsing JSON data


// Configure multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the directory where uploaded files will be stored
  },
  filename: (req, file, cb) => {
    // Generate a unique filename for the uploaded file
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.mp3');
  },
});

const upload = multer({ storage });



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
  
    // Get the title from the request body
    const { title } = req.body;
  
    if (!title) {
      // Delete the uploaded file if track data is invalid
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid track data - title is missing' });
    }
  
    // Generate a unique slug based on the track title
    const slug = title.toLowerCase().replace(/\s+/g, '-');
  
    // Check if the generated slug already exists
    const existingTrack = musicTracks.find((track) => track.slug === slug);
  
    if (existingTrack) {
      // Delete the uploaded file if a track with the same title exists
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Track with this title already exists' });
    }
  
    const newTrack = {
      id: (musicTracks.length + 1).toString(),
      title: title,
      slug: slug,
      mp3Url: req.file.path, // Store the path to the uploaded MP3 file
    };
  
    musicTracks.push(newTrack);
  
    // Call the 'saveMusicData' function to save the data to a JSON file
    saveMusicData();
  
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
