// --- WAKE LOCK LOGIC ---
let wakeLock = null;

async function toggleWakeLock() {
    const toggle = document.getElementById('wakeLockToggle');

    if (toggle.checked) {
        if ('wakeLock' in navigator) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => {
                    // If the lock is released (e.g., you minimize the browser), uncheck the box
                    if (document.visibilityState === 'visible') {
                        toggle.checked = false;
                    }
                });
            } catch (err) {
                alert("Your browser does not support keeping the screen on, or permission was denied.");
                toggle.checked = false;
            }
        } else {
            alert("The Wake Lock feature is not supported by your current browser.");
            toggle.checked = false;
        }
    } else {
        if (wakeLock !== null) {
            await wakeLock.release();
            wakeLock = null;
        }
    }
}

// If you switch away from the browser and come back, it tries to re-lock the screen if the box is checked
document.addEventListener('visibilitychange', async () => {
    const toggle = document.getElementById('wakeLockToggle');
    if (wakeLock !== null && document.visibilityState === 'visible' && toggle.checked) {
        // Re-request the wake lock
        wakeLock = await navigator.wakeLock.request('screen');
    }
});


// --- GAME TRACKER LOGIC ---
const gameConfig = {
    3: 20,
    4: 15,
    5: 12,
    6: 10
};

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6"];

function initializeGame() {
    const numPlayers = parseInt(document.getElementById('playerCount').value);
    const totalRounds = gameConfig[numPlayers];
    
    document.getElementById('gameDesc').innerHTML = `<strong>${numPlayers} Players = ${totalRounds} Rounds.</strong><br>Points: Correct Bid = 20 + (10 &times; Tricks). Incorrect = -10 &times; Difference.`;

    const thead = document.getElementById('tableHead');
    let headerHTML = '<tr><th>Round</th>';
    for (let p = 1; p <= numPlayers; p++) {
        headerHTML += `<th><input type="text" class="player-name" id="name-p${p}" value="${playerNames[p-1]}" oninput="saveNames()"></th>`;
    }
    headerHTML += '</tr>';
    thead.innerHTML = headerHTML;

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    for (let r = 1; r <= totalRounds; r++) {
        const tr = document.createElement('tr');
        
        let rowHTML = `<td>
            <div class="round-info">Round ${r}</div>
            <div class="tricks-avail">(${r} tricks)</div>
            <div class="bid-warning" id="warning-r${r}">Bids equal tricks!</div>
        </td>`;
        
        for (let p = 1; p <= numPlayers; p++) {
            rowHTML += `
                <td>
                    <div class="input-group">
                        <div>
                            <label>Bid</label>
                            <input type="number" min="0" max="${r}" class="bid p${p}-r${r}" oninput="calculateScores()">
                        </div>
                        <div>
                            <label>Won</label>
                            <input type="number" min="0" max="${r}" class="won p${p}-r${r}" oninput="calculateScores()">
                        </div>
                    </div>
                    <div class="scores">
                        Round: <span class="round-pts p${p}-r${r}">-</span>
                        <span class="total-score p${p}-r${r}">-</span>
                    </div>
                </td>
            `;
        }
        tr.innerHTML = rowHTML;
        tbody.appendChild(tr);
    }
    
    calculateScores();
}

function saveNames() {
    const numPlayers = parseInt(document.getElementById('playerCount').value);
    for(let p = 1; p <= numPlayers; p++) {
        const nameInput = document.getElementById(`name-p${p}`);
        if(nameInput) {
            playerNames[p-1] = nameInput.value;
        }
    }
}

function calculateScores() {
    const numPlayers = parseInt(document.getElementById('playerCount').value);
    const totalRounds = gameConfig[numPlayers];
    const enforceCanadianRule = document.getElementById('canadianRule').checked;

    for (let r = 1; r <= totalRounds; r++) {
        let totalBidsForRound = 0;
        let bidsEnteredCount = 0;

        for (let p = 1; p <= numPlayers; p++) {
            const bidInput = document.querySelector(`.bid.p${p}-r${r}`).value;
            if (bidInput !== "") {
                totalBidsForRound += parseInt(bidInput);
                bidsEnteredCount++;
            }
        }

        const warningElement = document.getElementById(`warning-r${r}`);
        if (enforceCanadianRule && bidsEnteredCount === numPlayers && totalBidsForRound === r) {
            warningElement.style.display = 'block';
        } else {
            warningElement.style.display = 'none';
        }
    }

    for (let p = 1; p <= numPlayers; p++) {
        let runningTotal = 0;
        
        for (let r = 1; r <= totalRounds; r++) {
            const bidInput = document.querySelector(`.bid.p${p}-r${r}`).value;
            const wonInput = document.querySelector(`.won.p${p}-r${r}`).value;
            const roundPtsDisplay = document.querySelector(`.round-pts.p${p}-r${r}`);
            const totalScoreDisplay = document.querySelector(`.total-score.p${p}-r${r}`);

            if (bidInput !== "" && wonInput !== "") {
                const bid = parseInt(bidInput);
                const won = parseInt(wonInput);
                let roundScore = 0;

                if (bid === won) {
                    roundScore = 20 + (won * 10);
                } else {
                    roundScore = -10 * Math.abs(bid - won);
                }

                runningTotal += roundScore;

                roundPtsDisplay.textContent = roundScore > 0 ? "+" + roundScore : roundScore;
                totalScoreDisplay.textContent = runningTotal;
                
                if (runningTotal < 0) {
                    totalScoreDisplay.classList.add('negative');
                } else {
                    totalScoreDisplay.classList.remove('negative');
                }
            } else {
                roundPtsDisplay.textContent = "-";
                totalScoreDisplay.textContent = "-";
            }
        }
    }
}

function resetBoard() {
    if(confirm("Are you sure you want to clear the entire board and start a new game?")) {
        const inputs = document.querySelectorAll('.bid, .won');
        inputs.forEach(input => input.value = '');
        calculateScores();
    }
}

window.onload = initializeGame;
