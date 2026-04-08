# Memory Lane - Photo Wall

A beautiful, responsive photo wall application that displays your memories in a scattered, paper-photo style with warm theme and interactive effects.

![Memory Lane](https://img.shields.io/badge/version-1.0.0-orange)

## Features

- **Responsive Design**: Supports multiple devices (mobile, tablet, desktop)
- **Warm Theme**: Soft gradient backgrounds with warm accent colors
- **Interactive Effects**:
  - Heart trail on hover
  - Floating animation for photos
  - Particle effects (orbs, fireflies, sparkles)
  - Lightbox with navigation
- **Auto Shuffle**: Photos reshuffle after 45 seconds of inactivity
- **Lazy Loading**: Optimized image loading with shimmer effect

## Layout

| Screen Size | Columns | Photo Size |
|-------------|---------|------------|
| Mobile (≤480px) | 3 | 28px height |
| Tablet (≤768px) | 4 | 35px height |
| Small Desktop (≤1024px) | 6 | 55px height |
| Desktop (>1024px) | 6 | 110px height |

## Quick Start

### Installation

```bash
npm install
```

### Run

```bash
npm start
```

Then open `http://localhost:3000` in your browser.

### Docker Deployment

**Prerequisites:** Copy `.env.example` to `.env` and configure `PHOTOS_PATH` for your photo directory.

**Option 1: Docker Compose (Recommended)**

```bash
docker-compose up -d
```

**Option 2: Docker Run**

```bash
docker run -d \
  -p 8080:8080 \
  -v /path/to/your/photos:/photos:ro \
  -e PHOTOS_DIR=/photos \
  -e PORT=8080 \
  --name memory-lane \
  memory-lane:latest
```

**Build Image:**

```bash
docker build -t memory-lane:latest .
```

**Environment Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `PHOTOS_DIR` | `/photos` | Directory containing photos (mounted via volume) |
| `PHOTOS_PATH` | - | Host path to photos (for docker-compose, set in `.env`) |

## Project Structure

```
├── public/
│   ├── index.html      # Main HTML file
│   ├── css/
│   │   ├── styles.css  # Main styles
│   │   └── animations.css # Animation keyframes
│   └── js/
│       └── app.js      # Application logic
├── server/
│   ├── index.js        # Express server
│   └── package.json    # Node.js dependencies
├── Dockerfile          # Docker image
├── docker-compose.yml  # Docker Compose configuration
├── .env.example        # Environment variables template
└── README.md
```

## Usage

- **Hover** on photos to see them pop up with heart trail effect
- **Click** on photos to open lightbox view
- **Navigate** lightbox with arrow keys or buttons
- **Shuffle** button to randomize photo positions
- Press **Escape** to close lightbox

## Technologies

- HTML5
- CSS3 (Custom properties, animations, backdrop-filter)
- Vanilla JavaScript (ES6+)
- Node.js & Express

## License

MIT
