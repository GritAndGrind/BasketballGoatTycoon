const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Import database functions from db.js
const { 
    addPlayerToLeaderboard, 
    getGoatLeaderboard, 
    getPlayerRank, 
    getTotalPlayerCount 
} = require('./db');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON request bodies
app.use(express.json());

// Handle the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get GOAT leaderboard
app.get('/api/goat-leaderboard', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const leaderboard = await getGoatLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
});

// API endpoint to add player to GOAT leaderboard
app.post('/api/goat-leaderboard', async (req, res) => {
  try {
    const playerData = req.body;
    
    // Validate required fields
    if (!playerData.player_name) {
      return res.status(400).json({ 
        error: 'Missing required field: player_name cannot be empty'
      });
    }
    
    // Set default values for any missing fields
    const defaultData = {
      position: 'PG',
      seasons_played: 1,
      total_points: 0,
      career_ppg: 0,
      championships: 0,
      mvps: 0,
      all_stars: 0,
      finals_mvps: 0,
      all_nba_first_teams: 0,
      all_nba_teams: 0,
      scoring_titles: 0,
      legacy_points: 0,
      goat_rating: 'Role Player'
    };
    
    // Merge player data with defaults for any missing fields
    const cleanedPlayerData = {
      ...defaultData,
      ...playerData,
      // Ensure numeric fields are actually numbers
      seasons_played: Number(playerData.seasons_played) || 1,
      total_points: Number(playerData.total_points) || 0,
      career_ppg: Number(playerData.career_ppg) || 0,
      championships: Number(playerData.championships) || 0,
      mvps: Number(playerData.mvps) || 0,
      all_stars: Number(playerData.all_stars) || 0,
      finals_mvps: Number(playerData.finals_mvps) || 0,
      all_nba_first_teams: Number(playerData.all_nba_first_teams) || 0,
      all_nba_teams: Number(playerData.all_nba_teams) || 0,
      scoring_titles: Number(playerData.scoring_titles) || 0,
      legacy_points: Number(playerData.legacy_points) || 0,
    };
    
    console.log('Adding player to leaderboard:', cleanedPlayerData);
    
    const result = await addPlayerToLeaderboard(cleanedPlayerData);
    
    // Get player's rank on the leaderboard
    const rank = await getPlayerRank(cleanedPlayerData.legacy_points);
    const totalPlayers = await getTotalPlayerCount();
    
    res.json({
      success: true,
      player: result,
      rank: rank,
      totalPlayers: totalPlayers
    });
  } catch (error) {
    console.error('Error adding player to leaderboard:', error);
    res.status(500).json({ error: 'Failed to add player to leaderboard' });
  }
});

// API endpoint to simulate a career season
app.post('/api/simulate-season', (req, res) => {
  const player = req.body.player;
  const currentSeason = req.body.season || 1;
  
  // Simulate a season based on player attributes
  const seasonResult = simulateSeason(player, currentSeason);
  
  res.json(seasonResult);
});

// Function to simulate a season based on player attributes
function simulateSeason(player, currentSeason) {
  // Log player info for debugging
  console.log("Simulating season for player:", player);
  //console.log("Player age from server:", data.age, "Type:", typeof data.age);
  console.log("Player object age property:", player.age);
  
  // Get base stats from player
  const { shooting, playmaking, defense, athleticism, basketball_iq, work_ethic, injury_prone } = player;
  
  // Apply age factor (players peak around 27-32)
  const age = player.age;
  let ageFactor = 1.0;
  
  if (age < 22) {
    // Young player still developing
    ageFactor = 0.8 + (age - 19) * 0.07;
  } else if (age >= 22 && age < 28) {
    // Rising to peak
    ageFactor = 0.95 + (age - 22) * 0.01;
  } else if (age >= 28 && age < 33) {
    // Prime years
    ageFactor = 1.0;
  } else if (age >= 33) {
    // Declining years
    //ageFactor = 1.0 - (age - 33) * 0.05;
	ageFactor = 0.6 - (age - 33) * 0.05;
  }
  
  // Apply work ethic to slow down decline or speed up development
  if (age < 27) {
    // Work ethic helps young players develop faster
    ageFactor += (work_ethic / 100) * 0.1;
  } else if (age > 32) {
    // Work ethic helps older players decline slower
    ageFactor += (work_ethic / 100) * 0.05;
  }
  
  // Calculate skill progression based on work ethic
  const skillImprovement = Math.max(0, (work_ethic / 20) - (age / 10));
  
  // Calculate injury risk
  //const injuryRisk = (injury_prone / 100) * (1 + (age > 30 ? (age - 30) * 0.03 : 0));
  //const hadMajorInjury = Math.random() < injuryRisk * 0.2;
  const injuryRisk = (injury_prone / 100) * (1 + (age > 30 ? (age - 30) * 0.01 : 0));
  const hadMajorInjury = Math.random() < injuryRisk * 0.1;
  const gamesPlayed = hadMajorInjury ? 
    Math.floor(Math.random() * 41) + 10 : // 10-50 games if major injury
    Math.floor(82 - (Math.random() * injuryRisk * 20)); // 82 minus some games for minor injuries
  
  // Calculate base stats for the season
  //let ppg = ((shooting * 0.4) + (playmaking * 0.3) + (athleticism * 0.2)) * ageFactor;
  //let rpg = ((athleticism * 0.4) + (defense * 0.3)) * ageFactor;
  //let apg = ((playmaking * 0.4) + (basketball_iq * 0.3)) * ageFactor;
  //let spg = ((defense * 0.4) + (athleticism * 0.3)) * ageFactor * 0.2;
  //let bpg = ((defense * 0.4) + (athleticism * 0.2)) * ageFactor * 0.2;
  let ppg = ((shooting * 0.2) + (playmaking * 0.1) + (athleticism * 0.1)) * ageFactor;
  let rpg = ((athleticism * 0.1) + (defense * 0.1)) * ageFactor;
  let apg = ((playmaking * 0.1) + (basketball_iq * 0.3)) * ageFactor;
  let spg = ((defense * 0.1) + (athleticism * 0.1)) * ageFactor * 0.1;
  let bpg = ((defense * 0.1) + (athleticism * 0.1)) * ageFactor * 0.1;
  // Add some randomness
  ppg = addRandomness(ppg, 0.3);
  rpg = addRandomness(rpg, 0.2);
  apg = addRandomness(apg, 0.2);
  spg = addRandomness(spg, 0.2);
  bpg = addRandomness(bpg, 0.2);
  
  // Adjust stats based on games played (injury factor)
  const injuryFactor = gamesPlayed / 82;
  
  // Determine team success (heavily influenced by player's stats and basketball IQ)
  let teamRecord = calculateTeamRecord(ppg, rpg, apg, spg, bpg, basketball_iq, currentSeason);
  
  // Calculate awards and accolades
  const accolades = calculateAcrolades(ppg, rpg, apg, spg, bpg, teamRecord, gamesPlayed);
  
  // Calculate new player ratings after the season
  const newPlayerRatings = {
    name: player.name, // Preserve the player name
    shooting: Math.min(99, player.shooting + (Math.random() * skillImprovement)),
    playmaking: Math.min(99, player.playmaking + (Math.random() * skillImprovement)),
    defense: Math.min(99, player.defense + (Math.random() * skillImprovement)),
    athleticism: Math.min(99, player.athleticism - (age > 30 ? 1 : -Math.random() * skillImprovement)),
    basketball_iq: Math.min(99, player.basketball_iq + (Math.random() * skillImprovement * 0.5)),
    work_ethic: player.work_ethic,
    injury_prone: Math.min(99, player.injury_prone + (hadMajorInjury ? 5 : 0)),
    age: age + 1,
    position: player.position // Preserve the player position
  };
  
  // Calculate legacy points based on stats and accolades
  const legacyPoints = calculateLegacyPoints(ppg, rpg, apg, accolades, teamRecord);
  
  return {
    season: currentSeason,
    age: age,
    stats: {
      ppg: ppg.toFixed(1),
      rpg: rpg.toFixed(1),
      apg: apg.toFixed(1),
      spg: spg.toFixed(1),
      bpg: bpg.toFixed(1),
      gamesPlayed: gamesPlayed
    },
    teamRecord: teamRecord,
    accolades: accolades,
    injuries: hadMajorInjury ? "Major injury" : (gamesPlayed < 75 ? "Minor injuries" : "Healthy season"),
    legacyPoints: legacyPoints,
    newRatings: newPlayerRatings
  };
}

// Helper function to add randomness to stats
function addRandomness(value, factor) {
  const randomFactor = 1 + ((Math.random() * 2 - 1) * factor);
  return value * randomFactor;
}

// Calculate team record based on player performance
function calculateTeamRecord(ppg, rpg, apg, spg, bpg, basketball_iq, seasonNumber) {
  // Base win contribution from the player
  //let winContribution = (ppg * 0.5 + rpg * 0.2 + apg * 0.3 + spg * 2 + bpg * 2 + basketball_iq * 0.3) / 25;
  let winContribution = (ppg * 0.5 + rpg * 0.2 + apg * 0.3 + spg * 2 + bpg * 2 + basketball_iq * 0.3) / 90;
  
  // Cap win contribution and add randomness for team factors
  winContribution = Math.min(0.75, winContribution);
  
  // Team factors (random additional wins 0-22 wins from teammates)
  const teamFactor = Math.random() * 0.275;
  
  // Calculate win percentage
  let winPercentage = winContribution + teamFactor;
  
  // Add randomness to simulate real-life variance
  winPercentage = addRandomness(winPercentage, 0.1);
  
  // Ensure win percentage is within bounds
  winPercentage = Math.max(0.1, Math.min(0.85, winPercentage));
  
  // Calculate wins and losses (82 game season)
  const wins = Math.floor(winPercentage * 82);
  const losses = 82 - wins;
  
  return {
    wins: wins,
    losses: losses
  };
}

// Calculate accolades for the season
function calculateAcrolades(ppg, rpg, apg, spg, bpg, teamRecord, gamesPlayed) {
  const accolades = [];
  
  // Only eligible for awards if played enough games
  if (gamesPlayed >= 58) { // 70% of season
    // All-Star selection (based on stats and team record)
    if (ppg > 23 || (ppg > 18 && apg > 7) || (ppg > 15 && rpg > 10)) {
      accolades.push("All-Star");
    }
    
    // All-NBA Teams
    if (ppg > 25 && teamRecord.wins > 45) {
      accolades.push("All-NBA First Team");
    } else if (ppg > 23 && teamRecord.wins > 40) {
      accolades.push("All-NBA Second Team");
    } else if (ppg > 20 && teamRecord.wins > 35) {
      accolades.push("All-NBA Third Team");
    }
    
    // Defensive Teams
    if (spg > 2 && bpg > 1 && teamRecord.wins > 42) {
      accolades.push("All-Defensive First Team");
    } else if (spg > 1.5 && bpg > 0.8 && teamRecord.wins > 38) {
      accolades.push("All-Defensive Second Team");
    }
    
    // MVP Consideration
    if (ppg > 26 && teamRecord.wins > 55 && (rpg > 7 || apg > 7)) {
      accolades.push("MVP");
    } else if (ppg > 25 && teamRecord.wins > 50 && (rpg > 6 || apg > 6)) {
      accolades.push("MVP Candidate");
    }
    
    // Scoring Title
    if (ppg > 28) {
      accolades.push("Scoring Champion");
    }
  }
  
  // Playoff success (based on team record)
  if (teamRecord.wins > 45) {
    if (teamRecord.wins > 60) {
      accolades.push("NBA Champion");
      accolades.push("Finals MVP");
    } else if (teamRecord.wins > 52) {
      accolades.push("Finals Appearance");
      if (Math.random() > 0.4) {
        accolades.push("NBA Champion");
        if (Math.random() > 0.3) {
          accolades.push("Finals MVP");
        }
      }
    } else if (teamRecord.wins > 48) {
      if (Math.random() > 0.6) {
        accolades.push("Conference Finals");
        if (Math.random() > 0.6) {
          accolades.push("Finals Appearance");
          if (Math.random() > 0.5) {
            accolades.push("NBA Champion");
            if (Math.random() > 0.4) {
              accolades.push("Finals MVP");
            }
          }
        }
      } else {
        accolades.push("Second Round Exit");
      }
    } else {
      if (Math.random() > 0.5) {
        accolades.push("First Round Exit");
      } else {
        accolades.push("Second Round Exit");
        if (Math.random() > 0.7) {
          accolades.push("Conference Finals");
          if (Math.random() > 0.7) {
            accolades.push("Finals Appearance");
            if (Math.random() > 0.6) {
              accolades.push("NBA Champion");
              if (Math.random() > 0.5) {
                accolades.push("Finals MVP");
              }
            }
          }
        }
      }
    }
  } else if (teamRecord.wins > 40) {
    if (Math.random() > 0.7) {
      accolades.push("First Round Exit");
    }
  } else {
    accolades.push("Missed Playoffs");
  }
  
  return accolades;
}

// Calculate legacy points based on performance
function calculateLegacyPoints(ppg, rpg, apg, accolades, teamRecord) {
  let points = 0;
  
  // Points from stats
  points += ppg * 1;
  points += rpg * 0.7;
  points += apg * 0.8;
  
  // Points from accolades
  accolades.forEach(accolade => {
    switch(accolade) {
      case "All-Star":
        points += 10;
        break;
      case "All-NBA First Team":
        points += 25;
        break;
      case "All-NBA Second Team":
        points += 15;
        break;
      case "All-NBA Third Team":
        points += 10;
        break;
      case "All-Defensive First Team":
        points += 15;
        break;
      case "All-Defensive Second Team":
        points += 8;
        break;
      case "MVP":
        points += 50;
        break;
      case "MVP Candidate":
        points += 20;
        break;
      case "Scoring Champion":
        points += 20;
        break;
      case "NBA Champion":
        points += 40;
        break;
      case "Finals MVP":
        points += 30;
        break;
      case "Finals Appearance":
        points += 20;
        break;
      case "Conference Finals":
        points += 10;
        break;
      case "Second Round Exit":
        points += 5;
        break;
      case "First Round Exit":
        points += 2;
        break;
    }
  });
  
  // Points from team success (regular season)
  points += teamRecord.wins * 0.5;
  
  return Math.round(points);
}

app.listen(PORT, () => {
  console.log(`Basketball Career Tycoon server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to play`);
});