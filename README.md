# Arena Hub

Arena Hub is a competitive tournament platform built with React, Vite, and Supabase.

## Features
- **Host Tournaments**: Create custom tournaments, set details, entry fees, and prize pools.
- **Team Registrations**: Players can register their squads and generate unique team codes.
- **Host Management dashboard**: Hosts can track registered teams, set room IDs, and verify payment screenshots.
- **Real-time Updates**: Live database changes using Supabase.
- **Tournament Completion & Trust**: Hosts upload prize payout screenshots which are publicly displayed to build community trust.

## Tech Stack
- **Frontend**: React.js, Vite
- **Styling**: Vanilla CSS, FontAwesome
- **Backend/Database**: Supabase (PostgreSQL, Realtime, Storage)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A Supabase project

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup
The application requires specific tables to be created in your Supabase project (`tournaments`, `registrations`, `squad_ranks`, `host_proofs`). Refer to the project's SQL files or artifacts for schema setup details.
