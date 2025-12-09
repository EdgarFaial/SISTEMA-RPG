// game-engine.js - Motor principal do jogo
class GameEngine {
    constructor() {
        this.currentCharacter = null;
        this.gameState = 'idle'; // idle, exploring, combat
        this.gameTime = 0;
        this.sessionStart = null;
        this.adventureLog = [];
        this.combatLog = [];
        this.diceRoller = null;
        this.mapPosition = { x: 5, y: 5 };
        this.inventory = new InventorySystem();
        this.notes = [];
        
        this.init();
    }

    async init() {
        console.log('Inicializando Game Engine...');
        
        // Espera o DOM carregar
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Verifica se estamos na página de jogo
        if (!document.querySelector('.game-container')) {
            console.log('Não está na página de jogo');
            return;
        }
        
        // Inicializa sistemas
        this.initializeDiceSystem();
        this.loadCharacters();
        this.initializeUI();
        this.initializeEventListeners();
        this.initializeGameClock();
        this.initializeMap();
        this.loadGameState();
        
        console.log('Game Engine inicializado com sucesso!');
    }

    // ============ INICIALIZAÇÃO DOS SISTEMAS ============

    initializeDiceSystem() {
        // Inicializa ou reutiliza o DiceRoller
        if (window.diceRoller) {
            this.diceRoller = window.diceRoller;
        } else {
            this.diceRoller = new DiceRoller();
            window.diceRoller = this.diceRoller;
        }
        
        // Configura evento para atualizar histórico
        document.addEventListener('diceRolled', (event) => {
            this.updateDiceHistory(event.detail);
            this.addToAdventureLog(`🎲 Rolou ${event.detail.expression}: ${event.detail.total}`);
        });
    }

    loadCharacters() {
        const selector = document.getElementById('current-character');
        if (!selector) return;
        
        const savedCharacters = JSON.parse(localStorage.getItem('rpgCharacters')) || [];
        
        // Limpa opções existentes
        selector.innerHTML = '<option value="">Selecione um Personagem</option>';
        
        // Adiciona personagens salvos
        savedCharacters.forEach((char, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${char.name} - Nível ${char.level || 1} ${char.class || ''}`;
            selector.appendChild(option);
        });
        
        // Tenta carregar personagem selecionado anteriormente
        const selectedChar = localStorage.getItem('selectedCharacter');
        if (selectedChar) {
            try {
                const char = JSON.parse(selectedChar);
                const index = savedCharacters.findIndex(c => c.id === char.id);
                if (index !== -1) {
                    selector.value = index;
                    this.loadCharacter(index);
                }
            } catch (e) {
                console.error('Erro ao carregar personagem:', e);
            }
        }
        
        // Configura evento de mudança
        selector.addEventListener('change', (e) => {
            if (e.target.value !== '') {
                this.loadCharacter(parseInt(e.target.value));
            } else {
                this.unloadCharacter();
            }
        });
    }

    initializeUI() {
        // Atualiza informações da sessão
        this.sessionStart = new Date();
        document.getElementById('session-start').textContent = 
            this.sessionStart.toLocaleTimeString();
        
        // Inicializa mensagem de boas-vindas
        this.updateGameMessage('Bem-vindo ao Sistema RPG!');
        
        // Configura tabs do inventário
        this.setupInventoryTabs();
        
        // Configura botões de ação
        this.setupActionButtons();
    }

    initializeEventListeners() {
        // Botões de dados
        document.querySelectorAll('.dice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const diceType = e.currentTarget.dataset.dice;
                this.rollDice(diceType);
            });
        });
        
        // Rolagem customizada
        document.getElementById('roll-custom')?.addEventListener('click', () => {
            this.rollCustomDice();
        });
        
        // Limpar histórico
        document.getElementById('clear-history')?.addEventListener('click', () => {
            this.clearDiceHistory();
        });
        
        // Ações de combate
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.performCombatAction(action);
            });
        });
        
        // Enviar mensagem no log
        document.getElementById('send-log')?.addEventListener('click', () => {
            this.sendLogMessage();
        });
        
        // Input de log com Enter
        document.getElementById('log-message')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendLogMessage();
            }
        });
        
        // Controles do mapa
        document.querySelectorAll('.dir-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const direction = e.currentTarget.dataset.direction;
                this.movePlayer(direction);
            });
        });
        
        // Botões de navegação
        document.getElementById('refresh-chars')?.addEventListener('click', () => {
            this.loadCharacters();
            this.updateGameMessage('Lista de personagens atualizada!');
        });
        
        document.getElementById('new-character')?.addEventListener('click', () => {
            window.location.href = '../pages/character-creator.html';
        });
        
        document.getElementById('game-settings')?.addEventListener('click', () => {
            this.showSettingsModal();
        });
        
        document.getElementById('help-btn')?.addEventListener('click', () => {
            this.showHelpModal();
        });
        
        // Botões de salvamento
        document.getElementById('quick-save')?.addEventListener('click', () => {
            this.quickSave();
        });
        
        document.getElementById('quick-load')?.addEventListener('click', () => {
            this.quickLoad();
        });
        
        // Configura auto-save
        this.setupAutoSave();
    }

    initializeGameClock() {
        // Inicia o relógio do jogo
        this.updateGameTime();
        setInterval(() => {
            this.gameTime++;
            this.updateGameTime();
            this.updateSessionDuration();
        }, 1000);
    }

    initializeMap() {
        // Gera grade do mapa básica
        this.generateMapGrid();
        
        // Posiciona jogador no centro
        this.updatePlayerPosition();
    }

    // ============ SISTEMA DE PERSONAGEM ============

    loadCharacter(index) {
        const savedCharacters = JSON.parse(localStorage.getItem('rpgCharacters')) || [];
        
        if (index >= 0 && index < savedCharacters.length) {
            this.currentCharacter = savedCharacters[index];
            
            // Salva seleção atual
            localStorage.setItem('selectedCharacter', JSON.stringify(this.currentCharacter));
            
            // Atualiza interface
            this.updateCharacterDisplay();
            this.updateInventoryDisplay();
            this.updateSkillsDisplay();
            
            // Atualiza mensagem
            this.updateGameMessage(`${this.currentCharacter.name} entrou na aventura!`);
            
            // Adiciona ao log
            this.addToAdventureLog(`👤 ${this.currentCharacter.name} juntou-se à aventura!`, 'system');
            
            // Atualiza estado do jogo
            this.gameState = 'exploring';
            document.getElementById('combat-mode').textContent = 'Exploração';
            
            return true;
        }
        
        return false;
    }

    unloadCharacter() {
        this.currentCharacter = null;
        
        // Limpa display do personagem
        document.getElementById('char-display-name').textContent = 'Nome do Personagem';
        document.getElementById('char-class').textContent = 'Classe';
        document.getElementById('char-race').textContent = 'Raça';
        document.getElementById('char-level').textContent = '1';
        document.getElementById('hp-value').textContent = '0/0';
        document.getElementById('hp-bar').style.width = '0%';
        document.getElementById('mana-value').textContent = '0/0';
        document.getElementById('mana-bar').style.width = '0%';
        document.getElementById('xp-value').textContent = '0/100';
        document.getElementById('xp-bar').style.width = '0%';
        
        // Atualiza estado do jogo
        this.gameState = 'idle';
        document.getElementById('combat-mode').textContent = 'Selecione um personagem';
        
        this.updateGameMessage('Nenhum personagem selecionado');
    }

    updateCharacterDisplay() {
        if (!this.currentCharacter) return;
        
        const char = this.currentCharacter;
        
        // Informações básicas
        document.getElementById('char-display-name').textContent = char.name;
        document.getElementById('char-class').textContent = this.getClassName(char.class);
        document.getElementById('char-race').textContent = this.getRaceName(char.race);
        document.getElementById('char-level').textContent = char.level || 1;
        
        // Status
        document.getElementById('hp-value').textContent = `${char.hp || 0}/${char.maxHp || 10}`;
        document.getElementById('mana-value').textContent = `${char.mana || 0}/${char.maxMana || 10}`;
        document.getElementById('xp-value').textContent = `${char.xp || 0}/100`;
        
        // Barras
        const hpPercent = ((char.hp || 0) / (char.maxHp || 10)) * 100;
        const manaPercent = ((char.mana || 0) / (char.maxMana || 10)) * 100;
        const xpPercent = ((char.xp || 0) / 100) * 100;
        
        document.getElementById('hp-bar').style.width = `${Math.max(0, hpPercent)}%`;
        document.getElementById('mana-bar').style.width = `${Math.max(0, manaPercent)}%`;
        document.getElementById('xp-bar').style.width = `${Math.max(0, Math.min(100, xpPercent))}%`;
        
        // Atributos rápidos
        document.getElementById('stat-ac').textContent = this.calculateAC(char);
        document.getElementById('stat-initiative').textContent = this.calculateInitiative(char);
        document.getElementById('stat-speed').textContent = '9m';
        document.getElementById('stat-gold').textContent = char.gold || 0;
        
        // Atributos detalhados
        const attributes = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        attributes.forEach(attr => {
            const value = char.attributes?.[attr] || 10;
            const mod = Math.floor((value - 10) / 2);
            
            document.getElementById(`attr-${attr}`).textContent = value;
            document.getElementById(`mod-${attr}`).textContent = mod >= 0 ? `+${mod}` : mod;
        });
        
        // Avatar
        this.updateCharacterAvatar();
    }

    calculateAC(character) {
        const baseAC = 10;
        const dexMod = Math.floor(((character.attributes?.dexterity || 10) - 10) / 2);
        return baseAC + dexMod;
    }

    calculateInitiative(character) {
        const dexMod = Math.floor(((character.attributes?.dexterity || 10) - 10) / 2);
        return dexMod >= 0 ? `+${dexMod}` : dexMod.toString();
    }

    getClassName(classKey) {
        const classes = {
            'warrior': 'Guerreiro',
            'mage': 'Mago',
            'rogue': 'Ladino',
            'cleric': 'Clérigo',
            'ranger': 'Ranger',
            'bard': 'Bardo'
        };
        return classes[classKey] || classKey;
    }

    getRaceName(raceKey) {
        const races = {
            'human': 'Humano',
            'elf': 'Elfo',
            'dwarf': 'Anão',
            'halfling': 'Halfling',
            'orc': 'Orc',
            'dragonborn': 'Dragonborn'
        };
        return races[raceKey] || raceKey;
    }

    updateCharacterAvatar() {
        const avatar = document.getElementById('char-avatar');
        if (!avatar || !this.currentCharacter) return;
        
        const gender = this.currentCharacter.appearance?.gender || 'male';
        const className = this.currentCharacter.class;
        
        const icons = {
            'warrior': gender === 'female' ? 'fas fa-female' : 'fas fa-male',
            'mage': 'fas fa-hat-wizard',
            'rogue': 'fas fa-user-ninja',
            'cleric': 'fas fa-pray',
            'ranger': 'fas fa-leaf',
            'bard': 'fas fa-music'
        };
        
        avatar.innerHTML = `<i class="${icons[className] || 'fas fa-user'}"></i>`;
    }

    // ============ SISTEMA DE DADOS ============

    rollDice(diceType) {
        if (!this.diceRoller) return;
        
        const result = this.diceRoller.rollSimple(
            parseInt(diceType.substring(1)),
            1,
            0
        );
        
        this.showDiceResult(result);
    }

    rollCustomDice() {
        const quantity = parseInt(document.getElementById('dice-count').value) || 1;
        const sides = parseInt(document.getElementById('dice-type').value) || 6;
        const modifier = parseInt(document.getElementById('dice-modifier').value) || 0;
        
        if (!this.diceRoller) return;
        
        const result = this.diceRoller.rollSimple(sides, quantity, modifier);
        this.showDiceResult(result);
    }

    showDiceResult(result) {
        // Cria elemento de resultado
        const resultElement = document.createElement('div');
        resultElement.className = 'dice-result-item';
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let resultHTML = `
            <div class="result-header">
                <span class="result-expression">${result.expression}</span>
                <span class="result-time">${time}</span>
            </div>
            <div class="result-body">
                <span class="result-total">${result.total}</span>
        `;
        
        if (result.rolls.length > 1) {
            resultHTML += `<span class="result-rolls">[${result.rolls.join(', ')}]</span>`;
        }
        
        if (result.critical) {
            resultHTML += '<span class="result-critical">🎯 CRÍTICO!</span>';
            resultElement.classList.add('critical-roll');
        }
        
        if (result.fumble) {
            resultHTML += '<span class="result-fumble">💥 FALHA!</span>';
            resultElement.classList.add('fumble-roll');
        }
        
        resultHTML += '</div>';
        resultElement.innerHTML = resultHTML;
        
        // Adiciona ao histórico
        const historyList = document.getElementById('dice-history');
        const emptyState = historyList.querySelector('.history-empty');
        
        if (emptyState) {
            emptyState.remove();
        }
        
        historyList.insertBefore(resultElement, historyList.firstChild);
        
        // Limita histórico a 10 itens
        while (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
        }
        
        // Efeito visual
        resultElement.style.animation = 'fadeInUp 0.3s ease-out';
    }

    updateDiceHistory(result) {
        // Atualiza o histórico automaticamente via evento
        const historyList = document.getElementById('dice-history');
        if (!historyList) return;
        
        const emptyState = historyList.querySelector('.history-empty');
        if (emptyState && historyList.children.length > 1) {
            emptyState.remove();
        }
    }

    clearDiceHistory() {
        const historyList = document.getElementById('dice-history');
        if (!historyList) return;
        
        historyList.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-history"></i>
                <p>Nenhuma rolagem ainda</p>
            </div>
        `;
        
        this.updateGameMessage('Histórico de dados limpo');
    }

    // ============ SISTEMA DE COMBATE ============

    performCombatAction(action) {
        if (!this.currentCharacter) {
            this.updateGameMessage('Selecione um personagem primeiro!');
            return;
        }
        
        if (this.gameState !== 'combat') {
            this.startCombat();
        }
        
        let message = '';
        let rollResult = null;
        
        switch (action) {
            case 'attack':
                rollResult = this.diceRoller.rollSimple(20, 1, 0);
                message = `⚔️ ${this.currentCharacter.name} ataca! Rolou ${rollResult.total} para acertar.`;
                this.addToCombatLog(message);
                break;
                
            case 'defend':
                message = `🛡️ ${this.currentCharacter.name} assume posição defensiva!`;
                this.addToCombatLog(message);
                break;
                
            case 'skill':
                message = `🎯 ${this.currentCharacter.name} usa uma perícia especial!`;
                this.addToCombatLog(message);
                break;
                
            case 'item':
                message = `💊 ${this.currentCharacter.name} usa um item!`;
                this.addToCombatLog(message);
                break;
                
            case 'magic':
                rollResult = this.diceRoller.rollSimple(20, 1, 0);
                message = `✨ ${this.currentCharacter.name} lança uma magia! Rolou ${rollResult.total} para concentração.`;
                this.addToCombatLog(message);
                break;
                
            case 'flee':
                message = `🏃 ${this.currentCharacter.name} tenta fugir do combate!`;
                this.addToCombatLog(message);
                this.endCombat();
                break;
        }
        
        // Incrementa turno
        if (action !== 'flee') {
            this.incrementTurn();
        }
    }

    startCombat() {
        this.gameState = 'combat';
        document.getElementById('combat-mode').textContent = 'Combate';
        document.getElementById('turn-count').textContent = '1';
        
        this.addToCombatLog('⚔️ COMBATE INICIADO!', 'combat-start');
        this.updateGameMessage('Combate iniciado!');
    }

    endCombat() {
        this.gameState = 'exploring';
        document.getElementById('combat-mode').textContent = 'Exploração';
        
        this.addToCombatLog('🏁 Combate encerrado!', 'combat-end');
        this.updateGameMessage('Combate encerrado');
    }

    incrementTurn() {
        const turnElement = document.getElementById('turn-count');
        let currentTurn = parseInt(turnElement.textContent) || 0;
        turnElement.textContent = currentTurn + 1;
    }

    addToCombatLog(message, type = 'action') {
        const logContent = document.getElementById('combat-log');
        const emptyState = logContent.querySelector('.log-empty');
        
        if (emptyState) {
            emptyState.remove();
        }
        
        const logEntry = document.createElement('div');
        logEntry.className = `combat-log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="log-time">[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
            <span class="log-message">${message}</span>
        `;
        
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
        
        // Limita log a 20 entradas
        while (logContent.children.length > 20) {
            logContent.removeChild(logContent.firstChild);
        }
        
        // Salva no array
        this.combatLog.push({
            time: new Date().toISOString(),
            message: message,
            type: type
        });
    }

    // ============ SISTEMA DE LOG DA AVENTURA ============

    sendLogMessage() {
        const input = document.getElementById('log-message');
        const message = input.value.trim();
        const type = document.getElementById('log-type').value;
        
        if (!message) return;
        
        this.addToAdventureLog(message, type);
        input.value = '';
        input.focus();
    }

    addToAdventureLog(message, type = 'action') {
        const logContent = document.getElementById('adventure-log');
        const welcomeMessage = logContent.querySelector('.welcome-message');
        
        if (welcomeMessage && this.adventureLog.length === 0) {
            welcomeMessage.remove();
        }
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const typeIcons = {
            'action': '🎬',
            'dialogue': '💬',
            'combat': '⚔️',
            'exploration': '🗺️',
            'loot': '💰',
            'note': '📝',
            'system': '⚙️'
        };
        
        const logEntry = document.createElement('div');
        logEntry.className = `adventure-log-entry ${type}`;
        logEntry.innerHTML = `
            <div class="log-header">
                <span class="log-type">${typeIcons[type] || '📝'}</span>
                <span class="log-time">${time}</span>
            </div>
            <div class="log-content">${message}</div>
        `;
        
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
        
        // Limita log a 50 entradas
        while (logContent.children.length > 50) {
            logContent.removeChild(logContent.firstChild);
        }
        
        // Salva no array
        this.adventureLog.push({
            time: new Date().toISOString(),
            message: message,
            type: type
        });
    }

    // ============ SISTEMA DE MAPA ============

    generateMapGrid() {
        const mapGrid = document.querySelector('.map-grid');
        if (!mapGrid) return;
        
        // Cria grade 11x11 (centro em 5,5)
        for (let y = 0; y < 11; y++) {
            for (let x = 0; x < 11; x++) {
                const cell = document.createElement('div');
                cell.className = 'map-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                // Define terreno baseado na posição
                const distanceFromCenter = Math.sqrt(Math.pow(x - 5, 2) + Math.pow(y - 5, 2));
                
                if (distanceFromCenter < 2) {
                    cell.classList.add('grass');
                } else if (distanceFromCenter < 4) {
                    cell.classList.add('forest');
                } else {
                    cell.classList.add('mountain');
                }
                
                mapGrid.appendChild(cell);
            }
        }
    }

    updatePlayerPosition() {
        const marker = document.getElementById('player-marker');
        if (!marker) return;
        
        // Calcula posição em porcentagem (5,5 é centro -> 50%,50%)
        const xPercent = (this.mapPosition.x / 10) * 100;
        const yPercent = (this.mapPosition.y / 10) * 100;
        
        marker.style.left = `${xPercent}%`;
        marker.style.top = `${yPercent}%`;
        
        // Atualiza descrição da localização
        this.updateLocationDescription();
    }

    movePlayer(direction) {
        if (!this.currentCharacter) {
            this.updateGameMessage('Selecione um personagem para se mover!');
            return;
        }
        
        const oldPos = { ...this.mapPosition };
        
        switch (direction) {
            case 'north':
                if (this.mapPosition.y > 0) this.mapPosition.y--;
                break;
            case 'south':
                if (this.mapPosition.y < 10) this.mapPosition.y++;
                break;
            case 'west':
                if (this.mapPosition.x > 0) this.mapPosition.x--;
                break;
            case 'east':
                if (this.mapPosition.x < 10) this.mapPosition.x++;
                break;
        }
        
        // Se a posição mudou
        if (oldPos.x !== this.mapPosition.x || oldPos.y !== this.mapPosition.y) {
            this.updatePlayerPosition();
            
            // Adiciona ao log
            const directions = {
                'north': 'norte',
                'south': 'sul', 
                'west': 'oeste',
                'east': 'leste'
            };
            
            this.addToAdventureLog(
                `🗺️ Moveu-se para ${directions[direction]}`,
                'exploration'
            );
            
            // Chance de encontro (20%)
            if (Math.random() < 0.2 && this.gameState !== 'combat') {
                this.randomEncounter();
            }
        }
    }

    updateLocationDescription() {
        const locationElement = document.getElementById('current-location');
        const descElement = document.getElementById('location-desc');
        
        if (!locationElement || !descElement) return;
        
        // Define localização baseada na posição no mapa
        const locations = [
            { name: 'Floresta dos Sussurros', desc: 'Uma floresta densa e misteriosa' },
            { name: 'Pântano das Sombras', desc: 'Áreas alagadas com névoa espessa' },
            { name: 'Montanhas Gélidas', desc: 'Picos cobertos de neve eterna' },
            { name: 'Planíces Douradas', desc: 'Campos vastos e ensolarados' },
            { name: 'Ruínas Antigas', desc: 'Estruturas de uma civilização perdida' }
        ];
        
        const locationIndex = Math.floor(Math.random() * locations.length);
        const location = locations[locationIndex];
        
        locationElement.textContent = location.name;
        descElement.textContent = location.desc;
    }

    randomEncounter() {
        const encounters = [
            { type: 'combat', message: 'Um grupo de goblins aparece da floresta!' },
            { type: 'treasure', message: 'Você encontrou um baú antigo!' },
            { type: 'npc', message: 'Um viajante misterioso se aproxima.' },
            { type: 'trap', message: 'Cuidado! Há uma armadilha no caminho!' }
        ];
        
        const encounter = encounters[Math.floor(Math.random() * encounters.length)];
        
        this.addToAdventureLog(`⚠️ ${encounter.message}`, 'exploration');
        this.updateGameMessage(encounter.message);
        
        if (encounter.type === 'combat') {
            this.startCombat();
            this.addToCombatLog(encounter.message, 'encounter');
        }
    }

    // ============ SISTEMA DE INVENTÁRIO ============

    setupInventoryTabs() {
        document.querySelectorAll('.inv-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                
                // Remove active de todas as tabs
                document.querySelectorAll('.inv-tab').forEach(t => {
                    t.classList.remove('active');
                });
                
                // Remove active de todos os conteúdos
                document.querySelectorAll('.inv-tab-content').forEach(c => {
                    c.classList.remove('active');
                });
                
                // Adiciona active na tab clicada
                e.currentTarget.classList.add('active');
                
                // Mostra conteúdo correspondente
                const content = document.getElementById(`tab-${tabName}`);
                if (content) {
                    content.classList.add('active');
                }
            });
        });
    }

    updateInventoryDisplay() {
        if (!this.currentCharacter) return;
        
        // Atualiza estatísticas
        const capacity = this.calculateInventoryCapacity();
        const weight = this.calculateInventoryWeight();
        
        document.getElementById('capacity-value').textContent = capacity;
        document.getElementById('weight-value').textContent = `${weight}kg`;
        document.getElementById('gold-value').textContent = this.currentCharacter.gold || 0;
        
        // Atualiza itens (implementação básica)
        this.renderInventoryItems();
    }

    calculateInventoryCapacity() {
        const baseCapacity = 100;
        const strMod = Math.floor(((this.currentCharacter?.attributes?.strength || 10) - 10) / 2);
        return `${this.currentCharacter?.inventory?.length || 0}/${baseCapacity + (strMod * 10)}`;
    }

    calculateInventoryWeight() {
        if (!this.currentCharacter?.inventory) return '0';
        
        return this.currentCharacter.inventory.reduce((total, item) => {
            return total + (item.weight || 0) * (item.quantity || 1);
        }, 0).toFixed(1);
    }

    renderInventoryItems() {
        const container = document.getElementById('tab-all');
        if (!container || !this.currentCharacter?.inventory) return;
        
        container.innerHTML = '';
        
        if (this.currentCharacter.inventory.length === 0) {
            container.innerHTML = `
                <div class="empty-inventory">
                    <i class="fas fa-box-open"></i>
                    <p>Inventário vazio</p>
                </div>
            `;
            return;
        }
        
        this.currentCharacter.inventory.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item-display';
            itemElement.innerHTML = `
                <div class="item-icon">
                    <i class="fas fa-${this.getItemIcon(item.type)}"></i>
                </div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-info">
                        <span class="item-quantity">Qtd: ${item.quantity || 1}</span>
                        <span class="item-weight">Peso: ${item.weight || 0}kg</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="item-action-btn" data-index="${index}" data-action="use">
                        <i class="fas fa-hand-holding"></i>
                    </button>
                    <button class="item-action-btn" data-index="${index}" data-action="drop">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(itemElement);
        });
        
        // Adiciona eventos aos botões de ação
        container.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.item-action-btn');
            if (actionBtn) {
                const index = parseInt(actionBtn.dataset.index);
                const action = actionBtn.dataset.action;
                this.handleItemAction(index, action);
            }
        });
    }

    getItemIcon(type) {
        const icons = {
            'weapon': 'sword',
            'armor': 'shield-alt',
            'tool': 'toolbox',
            'consumable': 'potion-bottle',
            'magic': 'magic',
            'quest': 'scroll'
        };
        return icons[type] || 'cube';
    }

    handleItemAction(index, action) {
        if (!this.currentCharacter?.inventory?.[index]) return;
        
        const item = this.currentCharacter.inventory[index];
        
        switch (action) {
            case 'use':
                this.useItem(item, index);
                break;
            case 'drop':
                this.dropItem(index);
                break;
        }
    }

    useItem(item, index) {
        this.addToAdventureLog(`💊 Usou ${item.name}`, 'action');
        this.updateGameMessage(`Usou ${item.name}`);
        
        // Lógica de uso do item (simplificada)
        if (item.type === 'consumable') {
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                this.currentCharacter.inventory.splice(index, 1);
            }
            this.updateInventoryDisplay();
        }
    }

    dropItem(index) {
        const item = this.currentCharacter.inventory[index];
        
        if (confirm(`Deseja descartar ${item.name}?`)) {
            this.currentCharacter.inventory.splice(index, 1);
            this.updateInventoryDisplay();
            this.addToAdventureLog(`🗑️ Descartou ${item.name}`, 'action');
            this.updateGameMessage(`Descartou ${item.name}`);
        }
    }

    // ============ SISTEMA DE PERÍCIAS ============

    updateSkillsDisplay() {
        if (!this.currentCharacter) return;
        
        const skillsList = document.getElementById('skills-list');
        if (!skillsList) return;
        
        skillsList.innerHTML = '';
        
        // Lista de perícias base
        const baseSkills = [
            { id: 'athletics', name: 'Atletismo', attr: 'str' },
            { id: 'acrobatics', name: 'Acrobacia', attr: 'dex' },
            { id: 'stealth', name: 'Furtividade', attr: 'dex' },
            { id: 'arcana', name: 'Arcanismo', attr: 'int' },
            { id: 'history', name: 'História', attr: 'int' },
            { id: 'perception', name: 'Percepção', attr: 'wis' },
            { id: 'survival', name: 'Sobrevivência', attr: 'wis' },
            { id: 'persuasion', name: 'Persuasão', attr: 'cha' }
        ];
        
        baseSkills.forEach(skill => {
            const attrValue = this.currentCharacter.attributes?.[skill.attr] || 10;
            const attrMod = Math.floor((attrValue - 10) / 2);
            const hasProficiency = this.currentCharacter.skills?.includes(skill.id);
            const totalMod = attrMod + (hasProficiency ? 2 : 0);
            
            const skillElement = document.createElement('div');
            skillElement.className = 'skill-item';
            skillElement.innerHTML = `
                <span class="skill-name">${skill.name} (${skill.attr.toUpperCase()})</span>
                <span class="skill-mod">${totalMod >= 0 ? '+' : ''}${totalMod}</span>
                <button class="skill-roll" data-skill="${skill.id}">
                    <i class="fas fa-dice"></i>
                </button>
            `;
            
            skillsList.appendChild(skillElement);
        });
        
        // Adiciona eventos de rolagem
        skillsList.addEventListener('click', (e) => {
            const rollBtn = e.target.closest('.skill-roll');
            if (rollBtn) {
                const skillId = rollBtn.dataset.skill;
                this.rollSkillCheck(skillId);
            }
        });
    }

    rollSkillCheck(skillId) {
        if (!this.currentCharacter) {
            this.updateGameMessage('Selecione um personagem primeiro!');
            return;
        }
        
        const skill = this.getSkillInfo(skillId);
        if (!skill) return;
        
        const attrValue = this.currentCharacter.attributes?.[skill.attr] || 10;
        const attrMod = Math.floor((attrValue - 10) / 2);
        const hasProficiency = this.currentCharacter.skills?.includes(skillId);
        const proficiencyBonus = hasProficiency ? 2 : 0;
        const totalMod = attrMod + proficiencyBonus;
        
        const rollResult = this.diceRoller.rollSimple(20, 1, totalMod);
        
        let message = `🎯 Teste de ${skill.name}: ${rollResult.total} `;
        message += `(d20: ${rollResult.rolls[0]} + ${totalMod >= 0 ? '+' : ''}${totalMod})`;
        
        if (rollResult.critical) {
            message += ' 🎯 CRÍTICO!';
        } else if (rollResult.fumble) {
            message += ' 💥 FALHA CRÍTICA!';
        }
        
        this.addToAdventureLog(message, 'action');
        this.updateGameMessage(`Testou ${skill.name}: ${rollResult.total}`);
    }

    getSkillInfo(skillId) {
        const skills = {
            'athletics': { name: 'Atletismo', attr: 'str' },
            'acrobatics': { name: 'Acrobacia', attr: 'dex' },
            'stealth': { name: 'Furtividade', attr: 'dex' },
            'arcana': { name: 'Arcanismo', attr: 'int' },
            'history': { name: 'História', attr: 'int' },
            'perception': { name: 'Percepção', attr: 'wis' },
            'survival': { name: 'Sobrevivência', attr: 'wis' },
            'persuasion': { name: 'Persuasão', attr: 'cha' }
        };
        
        return skills[skillId];
    }

    setupActionButtons() {
        // Botões rápidos do inventário
        document.getElementById('use-item')?.addEventListener('click', () => {
            this.updateGameMessage('Selecione um item para usar');
        });
        
        document.getElementById('drop-item')?.addEventListener('click', () => {
            this.updateGameMessage('Selecione um item para descartar');
        });
        
        document.getElementById('equip-item')?.addEventListener('click', () => {
            this.updateGameMessage('Selecione um item para equipar');
        });
        
        // Botão de teste de perícia
        document.getElementById('roll-check')?.addEventListener('click', () => {
            this.updateGameMessage('Clique em uma perícia para testar');
        });
    }

    // ============ SISTEMA DE NOTAS ============

    setupNotesSystem() {
        document.getElementById('new-note')?.addEventListener('click', () => {
            this.showNoteModal();
        });
        
        document.getElementById('save-note')?.addEventListener('click', () => {
            this.saveQuickNote();
        });
        
        document.getElementById('quick-note-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.saveQuickNote();
            }
        });
    }

    saveQuickNote() {
        const input = document.getElementById('quick-note-input');
        const note = input.value.trim();
        
        if (!note) return;
        
        const newNote = {
            id: Date.now(),
            content: note,
            timestamp: new Date().toISOString(),
            category: 'quick'
        };
        
        this.notes.push(newNote);
        this.updateNotesDisplay();
        
        input.value = '';
        this.addToAdventureLog(`📝 Anotação rápida: ${note}`, 'note');
    }

    updateNotesDisplay() {
        const notesList = document.getElementById('notes-list');
        if (!notesList) return;
        
        const emptyState = notesList.querySelector('.empty-notes');
        if (emptyState && this.notes.length > 0) {
            emptyState.remove();
        }
        
        if (this.notes.length === 0) {
            notesList.innerHTML = `
                <div class="empty-notes">
                    <i class="fas fa-edit"></i>
                    <p>Nenhuma nota ainda</p>
                </div>
            `;
            return;
        }
        
        // Mostra apenas as últimas 5 notas
        const recentNotes = this.notes.slice(-5).reverse();
        
        notesList.innerHTML = '';
        recentNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.innerHTML = `
                <div class="note-content">${note.content}</div>
                <div class="note-time">${new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            `;
            notesList.appendChild(noteElement);
        });
    }

    showNoteModal() {
        // Implementação básica do modal de notas
        alert('Funcionalidade de notas completa em desenvolvimento!');
    }

    // ============ SISTEMA DE TEMPO ============

    updateGameTime() {
        const timeElement = document.getElementById('game-time');
        if (!timeElement) return;
        
        const hours = Math.floor(this.gameTime / 3600);
        const minutes = Math.floor((this.gameTime % 3600) / 60);
        const seconds = this.gameTime % 60;
        
        timeElement.textContent = 
            `${hours.toString().padStart(2, '0')}:` +
            `${minutes.toString().padStart(2, '0')}:` +
            `${seconds.toString().padStart(2, '0')}`;
    }

    updateSessionDuration() {
        const durationElement = document.getElementById('session-duration');
        if (!durationElement || !this.sessionStart) return;
        
        const now = new Date();
        const diff = Math.floor((now - this.sessionStart) / 1000);
        
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        
        durationElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:` +
            `${seconds.toString().padStart(2, '0')}`;
    }

    // ============ SISTEMA DE MENSAGENS ============

    updateGameMessage(message) {
        const messageElement = document.getElementById('current-message');
        if (!messageElement) return;
        
        messageElement.textContent = message;
        
        // Efeito de fade
        messageElement.style.animation = 'none';
        setTimeout(() => {
            messageElement.style.animation = 'fadeInUp 0.5s ease-out';
        }, 10);
    }

    // ============ SISTEMA DE MODAIS ============

    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (!modal) return;
        
        // Carrega configurações salvas
        const settings = JSON.parse(localStorage.getItem('gameSettings')) || {};
        
        if (settings.darkMode !== undefined) {
            document.getElementById('dark-mode').checked = settings.darkMode;
        }
        
        if (settings.animations !== undefined) {
            document.getElementById('animations').checked = settings.animations;
        }
        
        if (settings.sounds !== undefined) {
            document.getElementById('sounds').checked = settings.sounds;
        }
        
        if (settings.difficulty) {
            document.getElementById('difficulty').value = settings.difficulty;
        }
        
        if (settings.autoSave) {
            document.getElementById('auto-save').value = settings.autoSave;
        }
        
        // Mostra modal
        modal.style.display = 'flex';
        
        // Configura eventos do modal
        const closeBtn = modal.querySelector('.close-modal');
        const saveBtn = document.getElementById('save-settings');
        const resetBtn = document.getElementById('reset-settings');
        
        const closeModal = () => {
            modal.style.display = 'none';
        };
        
        closeBtn.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
        
        saveBtn.onclick = () => {
            this.saveSettings();
            closeModal();
            this.updateGameMessage('Configurações salvas!');
        };
        
        resetBtn.onclick = () => {
            if (confirm('Resetar todas as configurações para padrão?')) {
                this.resetSettings();
                closeModal();
                this.updateGameMessage('Configurações resetadas!');
            }
        };
    }

    saveSettings() {
        const settings = {
            darkMode: document.getElementById('dark-mode').checked,
            animations: document.getElementById('animations').checked,
            sounds: document.getElementById('sounds').checked,
            difficulty: document.getElementById('difficulty').value,
            autoSave: document.getElementById('auto-save').value
        };
        
        localStorage.setItem('gameSettings', JSON.stringify(settings));
    }

    resetSettings() {
        localStorage.removeItem('gameSettings');
        
        // Reseta valores padrão
        document.getElementById('dark-mode').checked = true;
        document.getElementById('animations').checked = true;
        document.getElementById('sounds').checked = true;
        document.getElementById('difficulty').value = 'normal';
        document.getElementById('auto-save').value = '10';
    }

    showHelpModal() {
        const modal = document.getElementById('help-modal');
        if (!modal) return;
        
        modal.style.display = 'flex';
        
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    // ============ SISTEMA DE SALVAMENTO ============

    setupAutoSave() {
        const settings = JSON.parse(localStorage.getItem('gameSettings')) || {};
        const interval = parseInt(settings.autoSave || 10) * 60 * 1000; // minutos para milissegundos
        
        if (interval > 0) {
            setInterval(() => {
                if (this.currentCharacter) {
                    this.quickSave();
                }
            }, interval);
        }
    }

    quickSave() {
        if (!this.currentCharacter) {
            this.updateGameMessage('Nenhum personagem para salvar');
            return;
        }
        
        const gameState = {
            character: this.currentCharacter,
            gameTime: this.gameTime,
            mapPosition: this.mapPosition,
            adventureLog: this.adventureLog.slice(-20), // Salva apenas últimas 20 entradas
            notes: this.notes,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('quickSave', JSON.stringify(gameState));
        
        // Feedback visual
        const saveBtn = document.getElementById('quick-save');
        if (saveBtn) {
            const originalHTML = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Salvo!';
            saveBtn.style.background = '#4cd964';
            
            setTimeout(() => {
                saveBtn.innerHTML = originalHTML;
                saveBtn.style.background = '';
            }, 2000);
        }
        
        this.updateGameMessage('Jogo salvo automaticamente');
    }

    quickLoad() {
        const savedState = localStorage.getItem('quickSave');
        if (!savedState) {
            this.updateGameMessage('Nenhum save encontrado');
            return;
        }
        
        try {
            const state = JSON.parse(savedState);
            
            // Carrega personagem
            this.currentCharacter = state.character;
            this.gameTime = state.gameTime || 0;
            this.mapPosition = state.mapPosition || { x: 5, y: 5 };
            this.adventureLog = state.adventureLog || [];
            this.notes = state.notes || [];
            
            // Atualiza tudo
            this.updateCharacterDisplay();
            this.updatePlayerPosition();
            this.updateInventoryDisplay();
            this.updateSkillsDisplay();
            this.updateNotesDisplay();
            
            // Restaura log da aventura
            this.restoreAdventureLog();
            
            this.updateGameMessage('Jogo carregado com sucesso!');
            this.addToAdventureLog('⚙️ Jogo carregado de save rápido', 'system');
            
        } catch (e) {
            console.error('Erro ao carregar save:', e);
            this.updateGameMessage('Erro ao carregar save');
        }
    }

    restoreAdventureLog() {
        const logContent = document.getElementById('adventure-log');
        if (!logContent) return;
        
        logContent.innerHTML = '';
        
        if (this.adventureLog.length === 0) {
            logContent.innerHTML = `
                <div class="welcome-message">
                    <h4>Bem-vindo à sua aventura!</h4>
                    <p>Selecione um personagem para começar sua jornada épica.</p>
                </div>
            `;
            return;
        }
        
        this.adventureLog.forEach(logEntry => {
            const time = new Date(logEntry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const typeIcons = {
                'action': '🎬',
                'dialogue': '💬',
                'combat': '⚔️',
                'exploration': '🗺️',
                'loot': '💰',
                'note': '📝',
                'system': '⚙️'
            };
            
            const logElement = document.createElement('div');
            logElement.className = `adventure-log-entry ${logEntry.type}`;
            logElement.innerHTML = `
                <div class="log-header">
                    <span class="log-type">${typeIcons[logEntry.type] || '📝'}</span>
                    <span class="log-time">${time}</span>
                </div>
                <div class="log-content">${logEntry.message}</div>
            `;
            
            logContent.appendChild(logElement);
        });
        
        logContent.scrollTop = logContent.scrollHeight;
    }

    loadGameState() {
        // Tenta carregar estado salvo
        const savedState = localStorage.getItem('gameEngineState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                
                // Carrega estado básico
                this.gameTime = state.gameTime || 0;
                this.mapPosition = state.mapPosition || { x: 5, y: 5 };
                this.adventureLog = state.adventureLog || [];
                this.combatLog = state.combatLog || [];
                this.notes = state.notes || [];
                
                // Atualiza interface
                this.updateGameTime();
                this.updatePlayerPosition();
                this.updateNotesDisplay();
                
            } catch (e) {
                console.error('Erro ao carregar estado do jogo:', e);
            }
        }
    }

    saveGameState() {
        const state = {
            gameTime: this.gameTime,
            mapPosition: this.mapPosition,
            adventureLog: this.adventureLog.slice(-50), // Limita a 50 entradas
            combatLog: this.combatLog.slice(-20), // Limita a 20 entradas
            notes: this.notes.slice(-10), // Limita a 10 notas
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('gameEngineState', JSON.stringify(state));
    }

    // ============ UTILITÁRIOS ============

    setupAutoSave() {
        // Auto-save a cada 5 minutos
        setInterval(() => {
            this.saveGameState();
        }, 5 * 60 * 1000);
        
        // Auto-save ao sair
        window.addEventListener('beforeunload', () => {
            this.saveGameState();
        });
    }
}

// ============ SISTEMA DE INVENTÁRIO (Classe Auxiliar) ============
class InventorySystem {
    constructor() {
        this.items = [];
        this.capacity = 100;
        this.weight = 0;
    }
    
    addItem(item) {
        // Verifica se já existe item similar
        const existingItem = this.items.find(i => 
            i.id === item.id && i.name === item.name
        );
        
        if (existingItem) {
            existingItem.quantity += (item.quantity || 1);
        } else {
            this.items.push({
                ...item,
                quantity: item.quantity || 1
            });
        }
        
        this.calculateWeight();
        return true;
    }
    
    removeItem(itemId, quantity = 1) {
        const itemIndex = this.items.findIndex(i => i.id === itemId);
        
        if (itemIndex === -1) return false;
        
        const item = this.items[itemIndex];
        
        if (item.quantity > quantity) {
            item.quantity -= quantity;
        } else {
            this.items.splice(itemIndex, 1);
        }
        
        this.calculateWeight();
        return true;
    }
    
    calculateWeight() {
        this.weight = this.items.reduce((total, item) => {
            return total + (item.weight || 0) * (item.quantity || 1);
        }, 0);
        
        return this.weight;
    }
    
    getItemsByType(type) {
        return this.items.filter(item => item.type === type);
    }
    
    getItem(itemId) {
        return this.items.find(item => item.id === itemId);
    }
    
    clear() {
        this.items = [];
        this.weight = 0;
    }
}

// ============ INICIALIZAÇÃO DO JOGO ============

// Aguarda o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa o game engine
    window.gameEngine = new GameEngine();
    
    // Adiciona estilos dinâmicos
    const gameStyles = document.createElement('style');
    gameStyles.textContent = `
        .dice-result-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
            border-left: 4px solid #5496f2;
            animation: fadeInUp 0.3s ease-out;
        }
        
        .result-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .result-expression {
            font-weight: bold;
            color: #a0c4ff;
        }
        
        .result-time {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.6);
        }
        
        .result-body {
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .result-total {
            font-size: 2rem;
            font-weight: bold;
            color: white;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        .result-rolls {
            color: rgba(255, 255, 255, 0.8);
            font-family: 'Courier New', monospace;
        }
        
        .result-critical, .result-fumble {
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.9rem;
        }
        
        .result-critical {
            background: rgba(76, 217, 100, 0.2);
            color: #4cd964;
            border: 1px solid #4cd964;
        }
        
        .result-fumble {
            background: rgba(255, 107, 107, 0.2);
            color: #ff6b6b;
            border: 1px solid #ff6b6b;
        }
        
        .critical-roll {
            animation: criticalFlash 0.5s ease-out;
        }
        
        .fumble-roll {
            animation: fumbleShake 0.5s ease-out;
        }
        
        .adventure-log-entry {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
            border-left: 4px solid #5496f2;
            animation: fadeInUp 0.3s ease-out;
        }
        
        .adventure-log-entry.system {
            border-left-color: #ffcc00;
        }
        
        .adventure-log-entry.combat {
            border-left-color: #ff6b6b;
        }
        
        .adventure-log-entry.exploration {
            border-left-color: #4cd964;
        }
        
        .adventure-log-entry.loot {
            border-left-color: #ffcc00;
        }
        
        .adventure-log-entry.note {
            border-left-color: #a0c4ff;
        }
        
        .log-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }
        
        .log-type {
            font-size: 1.1rem;
        }
        
        .log-time {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.6);
        }
        
        .log-content {
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.5;
        }
        
        .combat-log-entry {
            padding: 8px 12px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 6px;
            border-left: 3px solid #ff6b6b;
            animation: fadeInUp 0.3s ease-out;
        }
        
        .combat-log-entry.combat-start {
            border-left-color: #ff3b30;
            background: rgba(255, 59, 48, 0.1);
        }
        
        .combat-log-entry.combat-end {
            border-left-color: #4cd964;
            background: rgba(76, 217, 100, 0.1);
        }
        
        .combat-log-entry.encounter {
            border-left-color: #ffcc00;
            background: rgba(255, 204, 0, 0.1);
        }
        
        .inventory-item-display {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            margin-bottom: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s;
        }
        
        .inventory-item-display:hover {
            border-color: #5496f2;
            transform: translateY(-2px);
        }
        
        .item-icon {
            font-size: 1.5rem;
            color: #5496f2;
            min-width: 40px;
            text-align: center;
        }
        
        .item-details {
            flex: 1;
        }
        
        .item-name {
            font-weight: 500;
            margin-bottom: 4px;
            color: white;
        }
        
        .item-info {
            display: flex;
            gap: 15px;
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .item-actions {
            display: flex;
            gap: 8px;
        }
        
        .item-action-btn {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }
        
        .item-action-btn:hover {
            background: rgba(84, 150, 242, 0.3);
            transform: scale(1.1);
        }
        
        .note-item {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
            border-left: 3px solid #a0c4ff;
        }
        
        .note-content {
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 8px;
            line-height: 1.5;
        }
        
        .note-time {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
            text-align: right;
        }
        
        .map-cell {
            position: absolute;
            width: 40px;
            height: 40px;
        }
        
        .map-cell.grass {
            background: rgba(76, 217, 100, 0.1);
            border: 1px solid rgba(76, 217, 100, 0.3);
        }
        
        .map-cell.forest {
            background: rgba(34, 139, 34, 0.1);
            border: 1px solid rgba(34, 139, 34, 0.3);
        }
        
        .map-cell.mountain {
            background: rgba(139, 69, 19, 0.1);
            border: 1px solid rgba(139, 69, 19, 0.3);
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes criticalFlash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes fumbleShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    
    document.head.appendChild(gameStyles);
});

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine, InventorySystem };
}