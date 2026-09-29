# FullStack Recipe App

A full-stack recipe application built with React Native + Expo for the frontend and Node.js + Express + Drizzle ORM + PostgreSQL for the backend.

This app allows users to browse recipes, search recipes, view recipe details, watch recipe videos, sign up and sign in with Clerk authentication, and save favorite recipes.

---

## Features

Pantry setup and validation instructions: [Back-end/PANTRY.md](Back-end/PANTRY.md).

- User authentication with Clerk
- Pantry inventory with quantities, expiry dates, and account-specific storage
- Browse recipes by category
- Search for recipes
- View detailed recipe information
- Watch recipe tutorial videos
- Save and remove favorite recipes
- Backend API for favorites
- PostgreSQL database integration with Drizzle ORM
- Works on Expo web
- Supports mobile testing with Expo

---

## Tech Stack

### Frontend
- React Native
- Expo
- Expo Router
- Clerk
- Expo Image
- Expo Vector Icons

### Backend
- Node.js
- Express
- Drizzle ORM
- PostgreSQL
- Neon Database
- CORS

---

## Project Structure

recipe-app-api
├── Back-end
│   ├── src
│   │   ├── config
│   │   ├── db
│   │   └── server.js
│   ├── package.json
│   └── drizzle.config.js
│
├── mobile
│   ├── app
│   │   ├── (auth)
│   │   ├── (tabs)
│   │   ├── recipe
│   │   └── _layout.jsx
│   ├── assets
│   ├── components
│   ├── constants
│   ├── hooks
│   ├── services
│   └── package.json

---

## Installation

### 1. Clone the repository

git clone https://github.com/datphandp333/recipe-app-api.git
cd recipe-app-api

---

## Backend Setup

### 1. Go to backend folder

cd Back-end

### 2. Install dependencies

npm install

### 3. Create .env

Example:

PORT=5001
DATABASE_URL=your_database_url_here
NODE_ENV=development

### 4. Run migrations

npx drizzle-kit generate
npx drizzle-kit migrate

### 5. Start backend server

node src/server.js

Backend runs on:

http://localhost:5001

---

## Frontend Setup

### 1. Go to mobile folder

cd mobile

### 2. Install dependencies

npm install

### 3. Create .env

Example:

EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

### 4. Start Expo

npx expo start -c

Frontend web runs on:

http://localhost:8081

---

## API Configuration

Inside mobile/constants/api.js:

import { Platform } from "react-native";

const WEB_API_URL = "http://localhost:5001/api";
const MOBILE_API_URL = "http://192.168.1.71:5001/api";

export const API_URL = Platform.OS === "web" ? WEB_API_URL : MOBILE_API_URL;

- WEB_API_URL is used for browser testing on PC
- MOBILE_API_URL is used for testing on phone or Expo Go

---

## Main API Routes

### Health Check
GET /api/health

### Get favorites by user
GET /api/favorites/:userId

### Add favorite
POST /api/favorites

### Delete favorite
DELETE /api/favorites/:userId/:recipeId

---

## Authentication

This project uses Clerk for:

- Sign up
- Sign in
- Email verification
- Session management

---

## Notes

- Keep the backend and frontend running in two separate terminals
- Web testing uses localhost
- Mobile testing may require your computer's local IP address
- iPhone testing may need extra setup depending on Expo Go

---

## Future Improvements

- Prevent duplicate favorites
- Improve mobile networking with HTTPS tunnel
- Better error handling
- Better responsive layout
- Deploy backend and frontend

---

## Author

Thanh Phan
