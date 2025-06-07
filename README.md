# 🌍 SustainedAway

**SustainedAway** is a comprehensive sustainability-focused web application that empowers users to make eco-conscious shopping decisions. The platform combines advanced image processing, AI analysis, and community features to provide detailed insights about product sustainability and environmental impact.

## 🌟 Key Features

- 📸 **Product Scanning**: Upload product images or bills for instant sustainability analysis
- 🧠 **AI-Powered Analysis**: Get detailed insights about product sustainability and health impact
- 🗺️ **Interactive Heat Map**: Visualize eco-friendly stores and sustainable shopping locations
- 🎮 **Gamified Experience**: Earn rewards and badges for sustainable shopping choices
- 🤝 **Community Features**: Share feedback and connect with like-minded eco-conscious shoppers
- 🐦 **Social Integration**: Share sustainability insights directly on X (Twitter)

## 🛠️ Technical Stack

### Frontend
- React 19
- Material-UI 7
- TailwindCSS 4
- Leaflet for maps
- Framer Motion for animations
- React Router for navigation

### Backend
- Node.js with Express
- Python for AI/ML processing
- Firebase/Firestore for data storage
- Cloudinary for image management
- Google Generative AI for analysis

## 🔧 Prerequisites

- Node.js (v14 or above)
- npm
- Python 3.x
- Firebase account and credentials
- Cloudinary account and credentials
- X (Twitter) API credentials
- Google AI API credentials

## 🚀 Installation & Setup

1. **Clone the repository**
```bash
git clone [repository-url]
cd sustainedaway
```

2. **Install dependencies**
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

3. **Configure environment variables**
Create a `.env` file in the root directory with:
```
FIREBASE_API_KEY=your_firebase_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET=your_twitter_secret
GOOGLE_AI_KEY=your_google_ai_key
```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the frontend development server**
```bash
npm run dev
```
Frontend will be available at: `http://localhost:3000`

2. **Start the backend servers**
```bash
# Start the main server
npm start
```
This will start all three backend servers:
- Main App Server: `http://localhost:5000`
- Python Analysis Server: `http://localhost:5001`
- Image Upload Server: `http://localhost:5002`

### Production Build

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
sustainedaway/
├── src/                    # Frontend source code
├── chrome-extension/       # Browser extension files
├── public/                # Static assets
├── server.js             # Main Express server
├── server2.js            # Python integration server
├── server3.js            # Image processing server
├── analyze_product.py    # Product analysis script
├── process_bill.py       # Bill processing script
├── process_image.py      # Image processing utilities
└── requirements.txt      # Python dependencies
```

## 🔄 API Endpoints

### Main Server (server.js)
- `POST /api/analyze` - Product analysis
- `GET /api/stores` - Get eco-friendly stores
- `POST /api/feedback` - Submit user feedback

### Python Server (server2.js)
- `POST /api/process-bill` - Process shopping bills
- `GET /api/sustainability-score` - Get product sustainability score

### Image Server (server3.js)
- `POST /api/upload` - Upload and process images
- `GET /api/image-analysis` - Get image analysis results

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google AI for analysis capabilities
- Cloudinary for image processing
- Leaflet for mapping functionality
- Firebase for backend services
- X (Twitter) for social integration

---
