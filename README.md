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
    - Go to your [Firebase Console](https://console.firebase.google.com/).
    - Create a new project or select an existing one.
    - In your project's settings (`Project settings` > `General` tab), find your web app configuration under "Your apps".
    - Copy the values from the `firebaseConfig` object into the corresponding `NEXT_PUBLIC_FIREBASE_` variables in your `.env.local` file.

3.  **Get Google AI (Gemini) API Key:**
    - Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
    - Create a new API key.
    - Copy the key and paste it as the value for `GEMINI_API_KEY` in your `.env.local` file.

Your `.env.local` file should look something like this:

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
# ... other firebase vars
GEMINI_API_KEY="your-gemini-api-key"
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
