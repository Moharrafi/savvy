<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1VtzfbhHj-c6qPtO62h_IegkCEmSSQgSB

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Set the API base URL in [.env.local](.env.local), example:
   `VITE_API_URL=http://localhost:3001`
4. Create the MySQL database and tables using [db/schema.sql](db/schema.sql).
5. Copy `server/.env.example` to `server/.env` and fill in your MySQL credentials.
6. Run the API server:
   `npm run server`
7. Run the app:
   `npm run dev`
