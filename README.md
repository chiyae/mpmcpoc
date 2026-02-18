# MediTrack Pro

This is a Next.js application for inventory management in clinics, built with Firebase and Genkit.

## Prerequisites

Make sure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Getting Started

Follow these steps to get the application running on your computer.

### 1. Install Dependencies

Open your terminal, navigate to the project directory, and run the following command to install all the necessary packages:

```bash
npm install
```

### 2. Set Up Environment Variables

The application requires credentials for Firebase and Google AI services.

1.  Create a copy of the example environment file. In your terminal, run:
    ```bash
    cp .env.example .env.local
    ```

2.  **Get Firebase Credentials:**
    - Go to the [Firebase Console](https://console.firebase.google.com/).
    - Select your project (or create one if you haven't already).
    - In the project overview, click the **Gear icon** (⚙️) next to "Project Overview" in the top-left sidebar, then select **Project settings**.
    - In the "General" tab, scroll down to the "Your apps" section.
    - If you don't have a web app yet, click the **</>** (Web) icon to create one. Give it a nickname and register the app.
    - Find your web app in the list and look for the `firebaseConfig` object. It will look like this:
      ```javascript
      const firebaseConfig = {
        apiKey: "AIza...",
        authDomain: "your-project.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project.appspot.com",
        messagingSenderId: "12345...",
        appId: "1:12345...:web:...",
        measurementId: "G-..."
      };
      ```
    - Copy the value for each key from this object and paste it into the corresponding `NEXT_PUBLIC_FIREBASE_` variable in your `.env.local` file. For example, the `apiKey` value goes into `NEXT_PUBLIC_FIREBASE_API_KEY`.

3.  **Get Google AI (Gemini) API Key:**
    - Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
    - Create a new API key.
    - Copy the key and paste it as the value for `GEMINI_API_KEY` in your `.env.local` file.

Your filled-out `.env.local` file should look similar to this:

```
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy...4U"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567890:web:abcdef123456"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-ABCDEFGHIJ"
GEMINI_API_KEY="AIzaSy...Yc"
```

### 3. Run the Development Server

Once your environment variables are set, you can start the application:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

The application also uses Genkit for AI features. To run the Genkit flows locally for development, you can use:
```bash
npm run genkit:dev
```

This script will also use the keys from your `.env.local` file.
# mpmcpoc
