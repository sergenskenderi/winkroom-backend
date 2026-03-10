# WinkRoom Backend

A real-time multiplayer game backend built with Node.js, Express, Socket.IO, and MongoDB.

## Features

- 🔐 **Authentication System** - JWT-based authentication with email verification
- 🎮 **Real-time Gaming** - Socket.IO for real-time game interactions
- 📚 **API Documentation** - Swagger/OpenAPI documentation
- 🗄️ **Database** - MongoDB with Mongoose ODM
- 📧 **Email Service** - Nodemailer for email notifications
- 🔒 **Security** - CORS, rate limiting, and input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT, Passport.js
- **Documentation**: Swagger/OpenAPI
- **Email**: Nodemailer with Handlebars templates

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd winkroom-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=5400
MONGODB_URI=mongodb://localhost:27017/winkroom
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:3000

# Email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# OAuth configuration (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY=your_apple_private_key
```

4. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run seed` - Seed the database with word pairs
- `npm run seed:games` - Seed the database with games

## API Documentation

Once the server is running, you can access the API documentation at:
```
http://localhost:5400/api-docs
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/verify-email` - Verify email address
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Games
- `GET /games` - Get all games
- `POST /games` - Create a new game
- `GET /games/:id` - Get game by ID
- `PUT /games/:id` - Update game
- `DELETE /games/:id` - Delete game

### Health Check
- `GET /health` - Server health status

## Socket.IO Events

### Client to Server
- `join-room` - Join a game room
- `leave-room` - Leave a game room

### Server to Client
- Connection/disconnection events are logged

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── scripts/         # Database seeding scripts
├── services/        # Business logic services
├── templates/       # Email templates
└── index.js         # Main application file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5400 |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3000 |
| `EMAIL_HOST` | SMTP host | - |
| `EMAIL_PORT` | SMTP port | - |
| `EMAIL_USER` | SMTP username | - |
| `EMAIL_PASS` | SMTP password | - |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.
