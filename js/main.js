// main.js - Script principal da aplicação

document.addEventListener('DOMContentLoaded', function () {
    // Carregar personagens salvos
    loadSavedCharacters();

    // Configurar demonstração de dados
    setupDiceDemo();

    // Animações de entrada
    animateElements();
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

    return card;
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
        displayElement.textContent = `Resultado: ${result}`;
        displayElement.classList.remove('dice-rolling');

        // Efeito sonoro (opcional)
        playDiceSound();
    }, 500);
}

// Toca som de dados rolando
function playDiceSound() {
    // Pode ser implementado quando tiver arquivos de som
    console.log('Som de dados rolando!');
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

// Adiciona estilo para os cards de personagem
const style = document.createElement('style');
style.textContent = `
    .character-card {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 15px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
    }
    
    .character-card:hover {
        border-color: #f6b93b;
        transform: translateY(-5px);
    }
    
    .character-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .character-level {
        background: #f6b93b;
        color: #000;
        padding: 5px 10px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 0.9rem;
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
        background: linear-gradient(45deg, #e55039, #fa983a);
        color: white;
        border: none;
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
    }
    
    .btn-delete {
        padding: 10px 15px;
        background: rgba(255, 0, 0, 0.2);
        color: #ff6b6b;
        border: 1px solid #ff6b6b;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .btn-delete:hover {
        background: rgba(255, 0, 0, 0.3);
    }
`;

document.head.appendChild(style);