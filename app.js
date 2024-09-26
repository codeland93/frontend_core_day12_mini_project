// Base URL for PokeAPI
const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/';

// Utility function: Capitalize first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Utility function: Show loading indicator
function showLoading(container) {
    container.innerHTML = '<p>Loading...</p>';
}

// Utility function: Show error message
function showError(container, message) {
    container.innerHTML = `<p class="text-danger">${message}</p>`;
}

// Utility function: Fetch Pokémon data
async function fetchPokemonData(pokemonNameOrId) {
    try {
        const response = await fetch(`${POKEAPI_BASE_URL}pokemon/${pokemonNameOrId}`);
        if (!response.ok) throw new Error('Pokémon not found');
        return await response.json();
    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
        throw error;
    }
}

// Utility function: Get current team from local storage
function getTeam() {
    return JSON.parse(localStorage.getItem('pokemonTeam')) || [];
}

// Utility function: Save team to local storage
function saveTeam(team) {
    localStorage.setItem('pokemonTeam', JSON.stringify(team));
}

// Function: Add Pokémon to team
function addToTeam(pokemon) {
    const team = getTeam();

    // Check if the Pokémon is already in the team by its ID
    if (team.some(p => p.id === pokemon.id)) {
        alert(`${capitalizeFirstLetter(pokemon.name)} is already in your team!`);
        return;
    }

    // Check team size limit
    if (team.length < 6) {
        team.push(pokemon);
        saveTeam(team);
        displayTeam();
    } else {
        alert('Your team is full! Maximum of 6 Pokémon.');
    }
}

// Function: Remove Pokémon from team
function removeFromTeam(id) {
    let team = getTeam();
    team = team.filter(pokemon => pokemon.id !== id); // Remove Pokémon by ID
    saveTeam(team);
    displayTeam();
}

// Function: Display the team on the team page
function displayTeam() {
    const team = getTeam();
    const teamContainer = document.getElementById('team');
    if (!teamContainer) return; // Prevent error if element not found

    teamContainer.innerHTML = ''; // Clear existing team display

    team.forEach((pokemon) => {
        teamContainer.innerHTML += `
            <div class="card m-2" style="width: 12rem;">
                <img src="${pokemon.sprites.front_default}" class="card-img-top" alt="${pokemon.name}">
                <div class="card-body">
                    <h5 class="card-title">${capitalizeFirstLetter(pokemon.name)}</h5>
                    <button class="btn btn-danger" onclick="removeFromTeam(${pokemon.id})">Remove</button>
                </div>
            </div>
        `;
    });
}

// Function: Display Pokémon info for search results
function displayPokemonInfo(pokemonData, container) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>${capitalizeFirstLetter(pokemonData.name)} (#${pokemonData.id})</h2>
            </div>
            <div class="card-body">
                <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}">
                <p><strong>Type:</strong> ${pokemonData.types.map(type => capitalizeFirstLetter(type.type.name)).join(', ')}</p>
                <p><strong>Height:</strong> ${pokemonData.height}</p>
                <p><strong>Weight:</strong> ${pokemonData.weight}</p>
                <a href="details.html?id=${pokemonData.id}" class="btn btn-primary">View Details</a>
                <button class="btn btn-success" onclick="addToTeam(${JSON.stringify(pokemonData)})">Add to Team</button>
            </div>
        </div>
    `;
}

// Function: Simulate battle between user and opponent teams
async function simulateBattle() {
    const yourTeam = getTeam();
    const opponentTeam = await generateRandomTeam();

    if (yourTeam.length === 0 || opponentTeam.length === 0) {
        alert('Both teams must have at least one Pokémon.');
        return;
    }

    // Basic battle logic: compare sum of base stats
    const yourTeamScore = yourTeam.reduce((sum, pokemon) => sum + getTotalBaseStats(pokemon), 0);
    const opponentTeamScore = opponentTeam.reduce((sum, pokemon) => sum + getTotalBaseStats(pokemon), 0);

    let result = '';
    if (yourTeamScore > opponentTeamScore) {
        result = 'You Win!';
    } else if (yourTeamScore < opponentTeamScore) {
        result = 'You Lose!';
    } else {
        result = 'It\'s a Draw!';
    }

    displayBattleResult(result, yourTeamScore, opponentTeamScore);
}

// Helper Function: Calculate total base stats for a Pokémon
function getTotalBaseStats(pokemon) {
    return pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
}

// Function: Generate a random opponent team
async function generateRandomTeam() {
    const team = [];
    const pokemonPromises = [];

    // Fetch 6 random Pokémon
    while (pokemonPromises.length < 6) {
        const randomId = Math.floor(Math.random() * 898) + 1; // Pokémon ID range (1-898)
        pokemonPromises.push(fetchPokemonData(randomId));
    }

    try {
        const pokemonDataArray = await Promise.all(pokemonPromises);
        pokemonDataArray.forEach(pokemonData => team.push(pokemonData));
    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
    }

    displayOpponentTeam(team);
    return team;
}

// Function: Display opponent team
function displayOpponentTeam(team) {
    const opponentContainer = document.getElementById('opponent-team');
    if (!opponentContainer) return;

    opponentContainer.innerHTML = ''; // Clear previous display

    team.forEach(pokemon => {
        opponentContainer.innerHTML += `
            <div class="card m-2" style="width: 12rem;">
                <img src="${pokemon.sprites.front_default}" class="card-img-top" alt="${pokemon.name}">
                <div class="card-body">
                    <h5 class="card-title">${capitalizeFirstLetter(pokemon.name)}</h5>
                </div>
            </div>
        `;
    });
}

// Function: Display battle result
function displayBattleResult(result, yourScore, opponentScore) {
    const battleResultContainer = document.getElementById('battle-result');
    if (!battleResultContainer) return;

    battleResultContainer.innerHTML = `
        <h3>${result}</h3>
        <p>Your Team Score: ${yourScore}</p>
        <p>Opponent Team Score: ${opponentScore}</p>
    `;
}

// Event Listener: Search form submission on search page
document.getElementById('search-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const pokemonName = document.getElementById('pokemon-name').value.toLowerCase();
    const pokemonInfo = document.getElementById('pokemon-info');
    
    showLoading(pokemonInfo); // Show loading indicator

    try {
        const pokemonData = await fetchPokemonData(pokemonName);
        displayPokemonInfo(pokemonData, pokemonInfo); // Display Pokémon info
    } catch (error) {
        showError(pokemonInfo, error.message); // Show error message
    }
});

// Event Listener: Battle button click on battle page
document.getElementById('start-battle')?.addEventListener('click', simulateBattle);

// Event Listener: Add Pokémon to team from team form submission
document.getElementById('team-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const pokemonName = document.getElementById('pokemon-name').value.toLowerCase();
    const pokemonInfo = document.getElementById('pokemon-info');

    try {
        const pokemonData = await fetchPokemonData(pokemonName);
        addToTeam(pokemonData); // Add Pokémon to team
    } catch (error) {
        showError(pokemonInfo, error.message); // Show error message
    }
});

// Initial display of team when team page loads
displayTeam();

// Additional functions incorporated from provided code

// Function: Generate a random opponent team
async function generateRandomTeam() {
    const team = [];
    const pokemonPromises = [];

    // Fetch 6 random Pokémon
    while (pokemonPromises.length < 6) {
        const randomId = Math.floor(Math.random() * 898) + 1; // Pokémon ID range (1-898)
        pokemonPromises.push(fetchPokemonData(randomId));
    }

    try {
        const pokemonDataArray = await Promise.all(pokemonPromises);
        pokemonDataArray.forEach(pokemonData => team.push(pokemonData));
    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
        alert('Failed to generate opponent team. Please check your internet connection.');
    }

    displayOpponentTeam(team); // Display the generated opponent team
    return team;
}

// Function: Simulate battle between user and opponent teams
async function simulateBattle() {
    const yourTeam = getTeam();
    const opponentTeam = await generateRandomTeam(); // Generate a random opponent team

    if (yourTeam.length === 0 || opponentTeam.length === 0) {
        alert('Both teams must have at least one Pokémon.');
        return;
    }

    // Basic battle logic: compare sum of base stats
    const yourTeamScore = yourTeam.reduce((sum, pokemon) => sum + getTotalBaseStats(pokemon), 0);
    const opponentTeamScore = opponentTeam.reduce((sum, pokemon) => sum + getTotalBaseStats(pokemon), 0);

    let result = '';
    if (yourTeamScore > opponentTeamScore) {
        result = 'You Win!';
    } else if (yourTeamScore < opponentTeamScore) {
        result = 'You Lose!';
    } else {
        result = 'It\'s a Draw!';
    }

    displayBattleResult(result, yourTeamScore, opponentTeamScore); // Display battle result
}
