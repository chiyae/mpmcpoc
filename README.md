# MediTrack Pro

This is a Next.js application for inventory management in clinics, built with Firebase and Genkit.

## Prerequisites

Make sure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Getting Started

Follow these steps to get the application running on your computer.

### 1. Install Dependencies

This is the most important step. Open your terminal (Command Prompt, PowerShell, or Terminal), navigate to the project directory, and run:

```bash
npm install
```

*Note: This creates the `node_modules` folder. If you skip this, you will see an error saying 'next' is not recognized.*

### 2. Set Up Environment Variables

The application requires credentials for Firebase and Google AI services.

1.  Create a copy of the example environment file:
    ```bash
    cp .env.example .env.local
    ```

2.  **Get Firebase Credentials:**
    - Go to the [Firebase Console](https://console.firebase.google.com/).
    - In your Project Settings, find your Web App's `firebaseConfig` object.
    - Copy the values into your `.env.local` file.

3.  **Get Google AI (Gemini) API Key:**
    - Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
    - Create a new API key and paste it as `GEMINI_API_KEY` in `.env.local`.

### 3. Run the Development Server

Once dependencies are installed and environment variables are set, start the app:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

## GitHub Instructions

To push this project to GitHub:

1. Initialize git: `git init`
2. Add files: `git add .`
3. Commit: `git commit -m "Initial commit"`
4. Create a repo on GitHub and follow their "push an existing repository" instructions.
