// main.js - Script principal da aplicação
console.log('Sistema RPG iniciado!');

document.addEventListener('DOMContentLoaded', function () {
    // Carregar personagens salvos
    loadSavedCharacters();

    // Configurar demonstração de dados
    setupDiceDemo();

    // Animações de entrada
    animateElements();
    
    // Configurar navegação
    setupNavigation();
});

// Carrega personagens salvos do localStorage
function loadSavedCharacters() {
    const charactersList = document.getElementById('characters-list');

    // Verifica se há personagens salvos
    const savedCharacters = JSON.parse(localStorage.getItem('rpgCharacters')) || [];

    if (savedCharacters.length === 0) {
        // Mostra estado vazio (já está no HTML)
        return;
    }

    // Limpa o estado vazio
    charactersList.innerHTML = '';

    // Cria cards para cada personagem
    savedCharacters.forEach((character, index) => {
        const characterCard = createCharacterCard(character, index);
        charactersList.appendChild(characterCard);
    });
}

// Cria um card de personagem
function createCharacterCard(character, index) {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.innerHTML = `
        <div class="character-header">
            <h3>${character.name}</h3>
            <span class="character-level">Nível ${character.level || 1}</span>
        </div>
        <div class="character-info">
            <p><strong>Raça:</strong> ${character.race || 'Não definida'}</p>
            <p><strong>Classe:</strong> ${character.class || 'Não definida'}</p>
            <p><strong>HP:</strong> ${character.hp || '???'}/${character.maxHp || '???'}</p>
        </div>
        <div class="character-actions">
            <button class="btn-play" data-index="${index}">
                <i class="fas fa-play"></i> Jogar
            </button>
            <button class="btn-delete" data-index="${index}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // Adiciona eventos aos botões
    setTimeout(() => {
        const playBtn = card.querySelector('.btn-play');
        const deleteBtn = card.querySelector('.btn-delete');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                // Salva o personagem selecionado
                localStorage.setItem('currentCharacter', JSON.stringify(character));
                window.location.href = 'pages/play-game.html';
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                deleteCharacter(index);
            });
        }
    }, 100);

    return card;
}

// Deleta um personagem
function deleteCharacter(index) {
    if (confirm('Tem certeza que deseja excluir este personagem?')) {
        const savedCharacters = JSON.parse(localStorage.getItem('rpgCharacters')) || [];
        savedCharacters.splice(index, 1);
        localStorage.setItem('rpgCharacters', JSON.stringify(savedCharacters));
        loadSavedCharacters(); // Recarrega a lista
    }
}

// Configura demonstração de rolagem de dados
function setupDiceDemo() {
    const diceButtons = document.querySelectorAll('.dice-demo');
    const resultDisplay = document.getElementById('dice-result');

    diceButtons.forEach(button => {
        button.addEventListener('click', function () {
            const diceType = this.dataset.dice;
            rollDemoDice(diceType, resultDisplay);
        });
    });
}

// Rolagem de dados para demonstração
function rollDemoDice(diceType, displayElement) {
    displayElement.textContent = "Rolando...";
    displayElement.classList.add('dice-rolling');

    // Determina o número máximo baseado no tipo de dado
    const max = parseInt(diceType.substring(1));

    setTimeout(() => {
        const result = Math.floor(Math.random() * max) + 1;
        displayElement.textContent = `🎲 Resultado: ${result}`;
        displayElement.classList.remove('dice-rolling');

        // Efeito sonoro (opcional)
        playDiceSound();
    }, 500);
}

// Toca som de dados rolando
function playDiceSound() {
    // Pode ser implementado quando tiver arquivos de som
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Som de dados rolando!');
    }
}

// Anima elementos na página
function animateElements() {
    const featureCards = document.querySelectorAll('.feature-card');

    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Configura navegação entre páginas
function setupNavigation() {
    // Verifica se há personagem ao clicar em "Jogar"
    const playLinks = document.querySelectorAll('a[href*="play-game"]');
    
    playLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const savedCharacters = JSON.parse(localStorage.getItem('rpgCharacters')) || [];
            if (savedCharacters.length === 0) {
                e.preventDefault();
                if (confirm('Você precisa criar um personagem primeiro. Ir para o criador de personagens?')) {
                    window.location.href = 'pages/character-creator.html';
                }
            }
        });
    });
}

// Função global para rolar dados
window.rollDice = function(sides, quantity = 1, modifier = 0) {
    let total = 0;
    let rolls = [];
    
    for (let i = 0; i < quantity; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        rolls.push(roll);
        total += roll;
    }
    
    total += modifier;
    
    return {
        total: total,
        rolls: rolls,
        modifier: modifier,
        expression: `${quantity}d${sides}${modifier >= 0 ? '+' + modifier : modifier}`
    };
};

// Função para salvar personagem
window.saveCharacter = function(characterData) {
    const savedCharacters = JSON.parse(localStorage.getItem('rpgCharacters')) || [];
    
    // Verifica se é um novo personagem ou edição
    if (characterData.id) {
        const index = savedCharacters.findIndex(char => char.id === characterData.id);
        if (index !== -1) {
            savedCharacters[index] = characterData;
        } else {
            characterData.id = Date.now();
            savedCharacters.push(characterData);
        }
    } else {
        characterData.id = Date.now();
        savedCharacters.push(characterData);
    }
    
    localStorage.setItem('rpgCharacters', JSON.stringify(savedCharacters));
    return characterData.id;
};

// Adiciona estilo para os cards de personagem
const style = document.createElement('style');
style.textContent = `
    .character-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 15px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
    }
    
    .character-card:hover {
        border-color: #5496f2;
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 13, 255, 0.3);
    }
    
    .character-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .character-level {
        background: rgba(84, 150, 242, 0.3);
        color: #ffffff;
        padding: 5px 10px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 0.9rem;
        border: 1px solid #5496f2;
    }
    
    .character-info p {
        margin-bottom: 8px;
        color: rgba(255, 255, 255, 0.9);
    }
    
    .character-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
    }
    
    .btn-play {
        flex: 1;
        padding: 10px;
        background: linear-gradient(45deg, rgba(0, 13, 255, 0.3), rgba(84, 150, 242, 0.3));
        color: white;
        border: 1px solid #5496f2;
        border-radius: 5px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.3s;
    }
    
    .btn-play:hover {
        transform: scale(1.05);
        background: linear-gradient(45deg, rgba(0, 13, 255, 0.5), rgba(84, 150, 242, 0.5));
    }
    
    .btn-delete {
        padding: 10px 15px;
        background: rgba(255, 107, 107, 0.1);
        color: #ff6b6b;
        border: 1px solid #ff6b6b;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .btn-delete:hover {
        background: rgba(255, 107, 107, 0.3);
    }
`;

document.head.appendChild(style);