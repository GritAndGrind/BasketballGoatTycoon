const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Connect to SQLite database
const dbPath = path.join(dataDir, 'basketball_tycoon.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the basketball_tycoon database.');
        // Initialize database tables
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Create goat_players table if it doesn't exist
    db.run(`
        CREATE TABLE IF NOT EXISTS goat_players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            position TEXT NOT NULL,
            seasons_played INTEGER NOT NULL,
            total_points INTEGER NOT NULL,
            career_ppg REAL NOT NULL,
            championships INTEGER NOT NULL,
            mvps INTEGER NOT NULL,
            all_stars INTEGER NOT NULL,
            finals_mvps INTEGER NOT NULL, 
            all_nba_first_teams INTEGER NOT NULL,
            all_nba_teams INTEGER NOT NULL,
            scoring_titles INTEGER NOT NULL,
            legacy_points INTEGER NOT NULL,
            goat_rating TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating goat_players table:', err.message);
        } else {
            console.log('goat_players table initialized.');
        }
    });
}

// Function to add a player to the GOAT leaderboard
function addPlayerToLeaderboard(playerData) {
    return new Promise((resolve, reject) => {
        const {
            player_name, 
            position,
            seasons_played,
            total_points,
            career_ppg,
            championships,
            mvps,
            all_stars, 
            finals_mvps,
            all_nba_first_teams,
            all_nba_teams,
            scoring_titles,
            legacy_points,
            goat_rating
        } = playerData;

        const query = `
            INSERT INTO goat_players (
                player_name, position, seasons_played, 
                total_points, career_ppg, championships, 
                mvps, all_stars, finals_mvps, 
                all_nba_first_teams, all_nba_teams, scoring_titles,
                legacy_points, goat_rating
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(query, [
            player_name, position, seasons_played,
            total_points, career_ppg, championships,
            mvps, all_stars, finals_mvps,
            all_nba_first_teams, all_nba_teams, scoring_titles,
            legacy_points, goat_rating
        ], function(err) {
            if (err) {
                console.error('Error adding player to leaderboard:', err.message);
                reject(err);
            } else {
                resolve({
                    id: this.lastID,
                    ...playerData
                });
            }
        });
    });
}

// Function to get the GOAT leaderboard (top players)
function getGoatLeaderboard(limit = 10) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * FROM goat_players 
            ORDER BY legacy_points DESC 
            LIMIT ?
        `;

        db.all(query, [limit], (err, rows) => {
            if (err) {
                console.error('Error getting GOAT leaderboard:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Function to get a player's rank on the GOAT leaderboard
function getPlayerRank(legacyPoints) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT COUNT(*) + 1 as rank 
            FROM goat_players 
            WHERE legacy_points > ?
        `;

        db.get(query, [legacyPoints], (err, row) => {
            if (err) {
                console.error('Error getting player rank:', err.message);
                reject(err);
            } else {
                resolve(row.rank);
            }
        });
    });
}

// Function to get total number of players in leaderboard
function getTotalPlayerCount() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT COUNT(*) as count FROM goat_players';

        db.get(query, [], (err, row) => {
            if (err) {
                console.error('Error getting player count:', err.message);
                reject(err);
            } else {
                resolve(row.count);
            }
        });
    });
}

// Export functions to be used in server.js
module.exports = {
    db,
    addPlayerToLeaderboard,
    getGoatLeaderboard,
    getPlayerRank,
    getTotalPlayerCount
};