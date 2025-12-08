// dice-roller.js - Sistema de rolagem de dados
class DiceRoller {
    constructor() {
        this.history = [];
        this.maxHistory = 50;
        this.loadHistory();
    }
    
    // Rola dados simples (ex: "2d6+3")
    roll(expression) {
        const result = this.parseRoll(expression);
        this.addToHistory(result);
        this.visualEffect(result);
        return result;
    }
    
    // Rola um único tipo de dado
    rollSimple(sides, quantity = 1, modifier = 0) {
        const expression = `${quantity}d${sides}${modifier >= 0 ? '+' + modifier : modifier}`;
        return this.roll(expression);
    }
    
    // Analisa expressão de dados
    parseRoll(expression) {
        // Formato: XdY+Z ou XdY-Z
        const match = expression.match(/^(\d+)d(\d+)([+-]\d+)?$/);
        
        if (!match) {
            throw new Error(`Expressão inválida: ${expression}`);
        }
        
        const quantity = parseInt(match[1]);
        const sides = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]) : 0;
        
        // Realiza as rolagens
        let total = 0;
        let rolls = [];
        let critical = false;
        let fumble = false;
        
        for (let i = 0; i < quantity; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            total += roll;
            
            // Verifica crítico/falha (apenas para d20)
            if (sides === 20) {
                if (roll === 20) critical = true;
                if (roll === 1) fumble = true;
            }
        }
        
        total += modifier;
        
        const result = {
            expression: expression,
            total: total,
            rolls: rolls,
            modifier: modifier,
            critical: critical,
            fumble: fumble,
            timestamp: new Date().toLocaleTimeString()
        };
        
        return result;
    }
    
    // Adiciona ao histórico
    addToHistory(result) {
        this.history.unshift(result);
        
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
        
        // Salva no localStorage
        localStorage.setItem('diceHistory', JSON.stringify(this.history));
        
        // Dispara evento customizado
        const event = new CustomEvent('diceRolled', { detail: result });
        document.dispatchEvent(event);
    }
    
    // Carrega histórico do localStorage
    loadHistory() {
        const saved = localStorage.getItem('diceHistory');
        if (saved) {
            this.history = JSON.parse(saved);
        }
        return this.history;
    }
    
    // Limpa histórico
    clearHistory() {
        this.history = [];
        localStorage.removeItem('diceHistory');
    }
    
    // Efeito visual para rolagem
    visualEffect(result) {
        // Cria elemento flutuante
        const effect = document.createElement('div');
        effect.className = 'dice-effect';
        effect.textContent = `🎲 ${result.total}`;
        effect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            z-index: 1000;
            animation: diceEffect 1s forwards;
        `;
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 1000);
    }
    
    // Gera estatísticas
    getStats() {
        const d20rolls = this.history.filter(r => r.expression.includes('d20'));
        
        if (d20rolls.length === 0) return null;
        
        const totals = d20rolls.map(r => r.total);
        const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
        
        return {
            totalRolls: this.history.length,
            d20Rolls: d20rolls.length,
            average: Math.round(avg * 100) / 100,
            highest: Math.max(...totals),
            lowest: Math.min(...totals),
            criticals: d20rolls.filter(r => r.critical).length,
            fumbles: d20rolls.filter(r => r.fumble).length
        };
    }
}

// Inicializa globalmente
window.diceRoller = new DiceRoller();

// Adiciona estilos para efeitos
const diceStyles = document.createElement('style');
diceStyles.textContent = `
    @keyframes diceEffect {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
        }
        50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
        }
    }
    
    .dice-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin: 20px 0;
    }
    
    .dice-btn {
        padding: 10px 20px;
        background: rgba(84, 150, 242, 0.2);
        border: 1px solid #5496f2;
        color: white;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s;
        font-weight: bold;
    }
    
    .dice-btn:hover {
        background: rgba(84, 150, 242, 0.4);
        transform: scale(1.05);
    }
    
    .dice-result-display {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        padding: 15px;
        margin: 10px 0;
        border-left: 4px solid #5496f2;
    }
    
    .critical {
        color: #4cd964;
        font-weight: bold;
        animation: pulse 1s infinite;
    }
    
    .fumble {
        color: #ff3b30;
        font-weight: bold;
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`;

document.head.appendChild(diceStyles);