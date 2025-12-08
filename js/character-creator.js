// character-creator.js - Sistema completo de criação de personagens
class CharacterCreator {
    constructor() {
        this.currentCharacter = this.getDefaultCharacter();
        this.attributePoints = 27;
        this.skills = this.getSkillsList();
        this.inventory = this.getStartingItems();
        this.init();
    }

    init() {
        console.log('Inicializando criador de personagens...');

        // Configurar abas
        this.setupTabs();

        // Configurar eventos dos inputs básicos
        this.setupBasicInputs();

        // Configurar sistema de atributos
        this.setupAttributes();

        // Configurar sistema de perícias
        this.setupSkills();

        // Configurar sistema de inventário
        this.setupInventory();

        // Configurar sistema de aparência
        this.setupAppearance();

        // Configurar botões de ação
        this.setupActionButtons();

        // Carregar personagem para edição (se houver)
        this.loadCharacterForEdit();

        // Atualizar preview inicial
        this.updatePreview();

        // Configurar auto-save
        this.setupAutoSave();
    }

    // ============ CONFIGURAÇÃO INICIAL ============

    getDefaultCharacter() {
        return {
            id: Date.now(),
            name: 'Novo Personagem',
            race: 'human',
            class: 'warrior',
            level: 1,
            attributes: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10
            },
            skills: [],
            inventory: [],
            appearance: {
                gender: 'male',
                age: 25,
                height: 175,
                weight: 70,
                description: ''
            },
            background: '',
            hp: 10,
            maxHp: 10,
            xp: 0,
            gold: 100,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
    }

    getSkillsList() {
        return [
            { id: 'athletics', name: 'Atletismo', attribute: 'strength', description: 'Pular, escalar, nadar' },
            { id: 'acrobatics', name: 'Acrobacia', attribute: 'dexterity', description: 'Equilíbrio, acrobacias' },
            { id: 'stealth', name: 'Furtividade', attribute: 'dexterity', description: 'Esconder-se, mover silenciosamente' },
            { id: 'arcana', name: 'Arcanismo', attribute: 'intelligence', description: 'Magia, itens mágicos' },
            { id: 'history', name: 'História', attribute: 'intelligence', description: 'Eventos históricos' },
            { id: 'investigation', name: 'Investigação', attribute: 'intelligence', description: 'Encontrar pistas, analisar' },
            { id: 'nature', name: 'Natureza', attribute: 'intelligence', description: 'Animais, plantas, terreno' },
            { id: 'religion', name: 'Religião', attribute: 'intelligence', description: 'Deuses, rituais, símbolos' },
            { id: 'medicine', name: 'Medicina', attribute: 'wisdom', description: 'Diagnóstico, tratamento' },
            { id: 'perception', name: 'Percepção', attribute: 'wisdom', description: 'Notar detalhes, ouvir' },
            { id: 'survival', name: 'Sobrevivência', attribute: 'wisdom', description: 'Rastrear, orientar-se' },
            { id: 'deception', name: 'Enganação', attribute: 'charisma', description: 'Mentir, disfarçar' },
            { id: 'intimidation', name: 'Intimidação', attribute: 'charisma', description: 'Amedrontar, coagir' },
            { id: 'performance', name: 'Atuação', attribute: 'charisma', description: 'Cantar, dançar, tocar' },
            { id: 'persuasion', name: 'Persuasão', attribute: 'charisma', description: 'Influenciar, negociar' }
        ];
    }

    getStartingItems() {
        return [
            { id: 'rations', name: 'Rações (1 dia)', quantity: 3, weight: 1, type: 'consumable' },
            { id: 'torch', name: 'Tocha', quantity: 1, weight: 1, type: 'tool' },
            { id: 'rope', name: 'Corda (15m)', quantity: 1, weight: 2.5, type: 'tool' }
        ];
    }

    // ============ CONFIGURAÇÃO DA INTERFACE ============

    setupTabs() {
        const tabButtons = document.querySelectorAll('.nav-btn');
        const tabSections = document.querySelectorAll('.creation-section');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetSection = button.dataset.section;

                // Remove active de todos
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabSections.forEach(section => section.classList.remove('active'));

                // Adiciona active no selecionado
                button.classList.add('active');
                const targetElement = document.getElementById(`${targetSection}-section`);
                if (targetElement) {
                    targetElement.classList.add('active');
                }

                // Salva aba atual
                this.currentCharacter.lastTab = targetSection;
                this.saveToLocalStorage();
            });
        });

        // Restaura aba salva
        if (this.currentCharacter.lastTab) {
            const savedTab = document.querySelector(`.nav-btn[data-section="${this.currentCharacter.lastTab}"]`);
            if (savedTab) {
                savedTab.click();
            }
        }
    }

    setupBasicInputs() {
        const inputs = {
            'char-name': 'name',
            'char-race': 'race',
            'char-class': 'class',
            'char-background': 'background'
        };

        for (const [elementId, property] of Object.entries(inputs)) {
            const element = document.getElementById(elementId);
            if (element) {
                // Carrega valor salvo
                if (this.currentCharacter[property]) {
                    if (element.tagName === 'SELECT') {
                        element.value = this.currentCharacter[property];
                    } else {
                        element.value = this.currentCharacter[property];
                    }
                }

                // Configura evento
                element.addEventListener('input', (e) => {
                    this.currentCharacter[property] = e.target.value;
                    this.updateCalculatedStats();
                    this.updatePreview();
                    this.saveToLocalStorage();
                });

                element.addEventListener('change', (e) => {
                    this.currentCharacter[property] = e.target.value;
                    this.updateCalculatedStats();
                    this.updatePreview();
                    this.saveToLocalStorage();
                });
            }
        }
    }

    setupAttributes() {
        const attributes = {
            'força': { key: 'strength', min: 8, max: 18 },
            'destreza': { key: 'dexterity', min: 8, max: 18 },
            'constituição': { key: 'constitution', min: 8, max: 18 },
            'inteligência': { key: 'intelligence', min: 8, max: 18 },
            'sabedoria': { key: 'wisdom', min: 8, max: 18 },
            'carisma': { key: 'charisma', min: 8, max: 18 }
        };

        const container = document.getElementById('attributes-container');
        if (!container) return;

        // Limpa container
        container.innerHTML = '';

        // Cria display de pontos
        this.pointsDisplay = document.createElement('div');
        this.pointsDisplay.className = 'points-remaining';
        this.pointsDisplay.innerHTML = `
            <strong><i class="fas fa-coins"></i> Pontos disponíveis: <span id="points-count">${this.attributePoints}</span></strong>
            <p class="hint">(Cada ponto até 13 custa 1, acima custa 2)</p>
        `;
        container.appendChild(this.pointsDisplay);

        // Cria controles para cada atributo
        for (const [name, config] of Object.entries(attributes)) {
            const currentValue = this.currentCharacter.attributes[config.key] || 10;

            const attributeDiv = document.createElement('div');
            attributeDiv.className = 'attribute-control';
            attributeDiv.innerHTML = `
                <div class="attribute-info">
                    <span class="attribute-name">${name.toUpperCase()}</span>
                    <span class="attribute-mod">Mod: ${this.getAttributeModifier(currentValue)}</span>
                    <span class="attribute-value" id="${config.key}-value">${currentValue}</span>
                </div>
                <div class="attribute-buttons">
                    <button class="attr-btn decrease" data-attr="${config.key}" ${currentValue <= config.min ? 'disabled' : ''}>-</button>
                    <button class="attr-btn increase" data-attr="${config.key}" ${currentValue >= config.max ? 'disabled' : ''}>+</button>
                </div>
            `;
            container.appendChild(attributeDiv);
        }

        // Adiciona eventos aos botões
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('attr-btn')) {
                const attrKey = e.target.dataset.attr;
                const isIncrease = e.target.classList.contains('increase');
                this.adjustAttribute(attrKey, isIncrease);
            }
        });
    }

    adjustAttribute(attrKey, isIncrease) {
        const currentValue = this.currentCharacter.attributes[attrKey] || 10;
        const cost = currentValue >= 13 ? 2 : 1;

        if (isIncrease && this.attributePoints >= cost && currentValue < 18) {
            this.currentCharacter.attributes[attrKey]++;
            this.attributePoints -= cost;
        } else if (!isIncrease && currentValue > 8) {
            this.currentCharacter.attributes[attrKey]--;
            this.attributePoints += (currentValue - 1 >= 13 ? 2 : 1);
        }

        this.updateAttributesDisplay();
        this.updateCalculatedStats();
        this.updatePreview();
        this.saveToLocalStorage();
    }

    updateAttributesDisplay() {
        // Atualiza valores dos atributos
        for (const [key, value] of Object.entries(this.currentCharacter.attributes)) {
            const valueElement = document.getElementById(`${key}-value`);
            const modElement = valueElement?.parentElement?.querySelector('.attribute-mod');

            if (valueElement) {
                valueElement.textContent = value;

                // Atualiza modificador
                if (modElement) {
                    modElement.textContent = `Mod: ${this.getAttributeModifier(value)}`;
                }
            }

            // Atualiza botões
            const increaseBtn = document.querySelector(`.increase[data-attr="${key}"]`);
            const decreaseBtn = document.querySelector(`.decrease[data-attr="${key}"]`);

            if (increaseBtn) {
                const cost = value >= 13 ? 2 : 1;
                increaseBtn.disabled = value >= 18 || this.attributePoints < cost;
            }
            if (decreaseBtn) {
                decreaseBtn.disabled = value <= 8;
            }
        }

        // Atualiza display de pontos
        const pointsCount = document.getElementById('points-count');
        if (pointsCount) {
            pointsCount.textContent = this.attributePoints;
            pointsCount.style.color = this.attributePoints < 0 ? '#ff3b30' : '#4cd964';
        }
    }

    getAttributeModifier(value) {
        const modifier = Math.floor((value - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : modifier.toString();
    }

    setupSkills() {
        const container = document.getElementById('skills-container');
        if (!container) return;

        // Limpa container
        container.innerHTML = '';

        // Cria itens de perícia
        this.skills.forEach(skill => {
            const isSelected = this.currentCharacter.skills.includes(skill.id);
            const attributeMod = this.getAttributeModifier(this.currentCharacter.attributes[skill.attribute]);

            const skillElement = document.createElement('div');
            skillElement.className = `skill-item ${isSelected ? 'selected' : ''}`;
            skillElement.dataset.skillId = skill.id;
            skillElement.innerHTML = `
                <input type="checkbox" id="skill-${skill.id}" ${isSelected ? 'checked' : ''} hidden>
                <div class="skill-checkbox">
                    <i class="fas fa-${isSelected ? 'check-square' : 'square'}"></i>
                </div>
                <div class="skill-info">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-details">
                        <span class="skill-attr">${skill.attribute.substr(0, 3).toUpperCase()}</span>
                        <span class="skill-mod">${attributeMod}</span>
                    </div>
                </div>
            `;

            skillElement.addEventListener('click', () => {
                this.toggleSkill(skill.id);
            });

            container.appendChild(skillElement);
        });
    }

    toggleSkill(skillId) {
        const index = this.currentCharacter.skills.indexOf(skillId);

        if (index === -1) {
            // Limita a 4 perícias iniciais
            if (this.currentCharacter.skills.length < 4) {
                this.currentCharacter.skills.push(skillId);
            } else {
                alert('Você pode escolher no máximo 4 perícias iniciais!');
                return;
            }
        } else {
            this.currentCharacter.skills.splice(index, 1);
        }

        // Atualiza visualização
        const skillElement = document.querySelector(`.skill-item[data-skill-id="${skillId}"]`);
        if (skillElement) {
            const checkbox = skillElement.querySelector('input[type="checkbox"]');
            const icon = skillElement.querySelector('.fa');

            checkbox.checked = !checkbox.checked;
            skillElement.classList.toggle('selected');
            icon.className = checkbox.checked ? 'fas fa-check-square' : 'fas fa-square';
        }

        this.saveToLocalStorage();
    }

    setupInventory() {
        const container = document.getElementById('inventory-container');
        if (!container) return;

        this.renderInventory();

        // Configura botões
        document.getElementById('add-item-btn')?.addEventListener('click', () => {
            this.showAddItemModal();
        });

        document.getElementById('clear-inventory-btn')?.addEventListener('click', () => {
            if (confirm('Limpar todo o inventário?')) {
                this.currentCharacter.inventory = [];
                this.renderInventory();
                this.saveToLocalStorage();
            }
        });
    }

    renderInventory() {
        const container = document.getElementById('inventory-container');
        if (!container) return;

        container.innerHTML = '';

        // Adiciona itens padrão
        this.getStartingItems().forEach(item => {
            if (!this.currentCharacter.inventory.some(i => i.id === item.id)) {
                this.currentCharacter.inventory.push({ ...item });
            }
        });

        // Renderiza itens
        this.currentCharacter.inventory.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.innerHTML = `
                <button class="item-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
                <div class="item-icon">
                    <i class="fas fa-${this.getItemIcon(item.type)}"></i>
                </div>
                <div class="item-name">${item.name}</div>
                <div class="item-quantity">x${item.quantity}</div>
                <div class="item-weight">${item.weight} kg</div>
            `;

            container.appendChild(itemElement);
        });

        // Adiciona eventos de remoção
        container.addEventListener('click', (e) => {
            if (e.target.closest('.item-remove')) {
                const index = parseInt(e.target.closest('.item-remove').dataset.index);
                this.removeItem(index);
            }
        });

        // Atualiza peso total
        this.updateInventoryWeight();
    }

    getItemIcon(type) {
        const icons = {
            'weapon': 'sword',
            'armor': 'shield-alt',
            'tool': 'toolbox',
            'consumable': 'potion-bottle',
            'magic': 'magic',
            'quest': 'scroll',
            'default': 'cube'
        };
        return icons[type] || icons.default;
    }

    showAddItemModal() {
        // Cria modal básico para adicionar item
        const modalHtml = `
            <h3><i class="fas fa-plus"></i> Adicionar Item</h3>
            <div class="modal-body">
                <div class="form-group">
                    <label for="item-name">Nome do Item</label>
                    <input type="text" id="item-name" placeholder="Ex: Espada Longa">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="item-quantity">Quantidade</label>
                        <input type="number" id="item-quantity" value="1" min="1" max="99">
                    </div>
                    <div class="form-group">
                        <label for="item-weight">Peso (kg)</label>
                        <input type="number" id="item-weight" value="1" min="0.1" max="100" step="0.1">
                    </div>
                </div>
                <div class="form-group">
                    <label for="item-type">Tipo</label>
                    <select id="item-type">
                        <option value="weapon">Arma</option>
                        <option value="armor">Armadura</option>
                        <option value="tool">Ferramenta</option>
                        <option value="consumable">Consumível</option>
                        <option value="magic">Mágico</option>
                        <option value="quest">Quest</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button id="cancel-add-item" class="btn-secondary">Cancelar</button>
                    <button id="confirm-add-item" class="btn-primary">Adicionar</button>
                </div>
            </div>
        `;

        // Cria e mostra modal
        this.showModal(modalHtml);

        // Configura eventos do modal
        document.getElementById('confirm-add-item')?.addEventListener('click', () => {
            this.addCustomItem();
            this.hideModal();
        });

        document.getElementById('cancel-add-item')?.addEventListener('click', () => {
            this.hideModal();
        });
    }

    addCustomItem() {
        const name = document.getElementById('item-name')?.value;
        const quantity = parseInt(document.getElementById('item-quantity')?.value || 1);
        const weight = parseFloat(document.getElementById('item-weight')?.value || 1);
        const type = document.getElementById('item-type')?.value || 'tool';

        if (!name || name.trim() === '') {
            alert('Por favor, digite um nome para o item!');
            return;
        }

        const newItem = {
            id: `custom_${Date.now()}`,
            name: name.trim(),
            quantity: quantity,
            weight: weight,
            type: type
        };

        this.currentCharacter.inventory.push(newItem);
        this.renderInventory();
        this.saveToLocalStorage();
    }

    removeItem(index) {
        // Não permite remover itens padrão
        const item = this.currentCharacter.inventory[index];
        const startingItems = this.getStartingItems().map(i => i.id);

        if (startingItems.includes(item.id)) {
            alert('Este é um item padrão e não pode ser removido!');
            return;
        }

        this.currentCharacter.inventory.splice(index, 1);
        this.renderInventory();
        this.saveToLocalStorage();
    }

    updateInventoryWeight() {
        const totalWeight = this.currentCharacter.inventory.reduce((sum, item) => {
            return sum + (item.weight * item.quantity);
        }, 0);

        // Atualiza display do peso (se existir)
        const weightDisplay = document.getElementById('inventory-weight');
        if (!weightDisplay) {
            const container = document.getElementById('inventory-container');
            if (container) {
                const weightElement = document.createElement('div');
                weightElement.id = 'inventory-weight';
                weightElement.className = 'inventory-weight';
                weightElement.innerHTML = `<strong>Peso Total: ${totalWeight.toFixed(1)} kg</strong>`;
                container.parentElement.insertBefore(weightElement, container.nextSibling);
            }
        } else {
            weightDisplay.innerHTML = `<strong>Peso Total: ${totalWeight.toFixed(1)} kg</strong>`;
        }
    }

    setupAppearance() {
        const inputs = {
            'char-gender': 'gender',
            'char-age': 'age',
            'char-height': 'height',
            'char-weight': 'weight',
            'char-description': 'description'
        };

        for (const [elementId, property] of Object.entries(inputs)) {
            const element = document.getElementById(elementId);
            if (element) {
                // Carrega valor salvo
                if (this.currentCharacter.appearance[property] !== undefined) {
                    if (element.tagName === 'SELECT') {
                        element.value = this.currentCharacter.appearance[property];
                    } else if (element.tagName === 'TEXTAREA') {
                        element.value = this.currentCharacter.appearance[property];
                    } else {
                        element.value = this.currentCharacter.appearance[property];
                    }
                }

                // Configura evento
                element.addEventListener('input', (e) => {
                    this.currentCharacter.appearance[property] = e.target.value;
                    this.updatePreview();
                    this.saveToLocalStorage();
                });

                element.addEventListener('change', (e) => {
                    this.currentCharacter.appearance[property] = e.target.value;
                    this.updatePreview();
                    this.saveToLocalStorage();
                });
            }
        }
    }

    setupActionButtons() {
        // Botão Salvar
        document.getElementById('save-character')?.addEventListener('click', () => {
            this.saveCharacter();
        });

        // Botão Exportar
        document.getElementById('export-character')?.addEventListener('click', () => {
            this.exportCharacter();
        });

        // Botão Aleatório
        document.getElementById('randomize-btn')?.addEventListener('click', () => {
            this.randomizeCharacter();
        });

        // Botão Resetar
        document.getElementById('reset-btn')?.addEventListener('click', () => {
            this.resetCharacter();
        });
    }

    // ============ FUNÇÕES DE CÁLCULO ============

    updateCalculatedStats() {
        // Calcula HP baseado em constituição
        const conMod = Math.floor((this.currentCharacter.attributes.constitution - 10) / 2);
        const baseHP = this.getClassBaseHP(this.currentCharacter.class);
        this.currentCharacter.maxHp = baseHP + conMod;
        this.currentCharacter.hp = this.currentCharacter.maxHp;

        // Calcula outros stats baseados em raça/classe
        this.applyRaceBonuses();
        this.applyClassFeatures();
    }

    getClassBaseHP(className) {
        const baseHP = {
            'warrior': 12,
            'mage': 6,
            'rogue': 8,
            'cleric': 10,
            'ranger': 10,
            'bard': 8
        };
        return baseHP[className] || 10;
    }

    applyRaceBonuses() {
        const bonuses = {
            'human': { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
            'elf': { dexterity: 2, intelligence: 1 },
            'dwarf': { constitution: 2, wisdom: 1 },
            'halfling': { dexterity: 2, charisma: 1 },
            'orc': { strength: 2, constitution: 1 },
            'dragonborn': { strength: 2, charisma: 1 }
        };

        // Aplica bônus (já considerados nos valores base)
    }

    applyClassFeatures() {
        // Aplica features específicas da classe
        // Pode ser expandido depois
    }

    // ============ FUNÇÕES DE PREVIEW ============

    updatePreview() {
        // Atualiza informações básicas
        this.updateElement('preview-name', this.currentCharacter.name);
        this.updateElement('preview-race', this.getRaceName(this.currentCharacter.race));
        this.updateElement('preview-class', this.getClassName(this.currentCharacter.class));
        this.updateElement('preview-hp', this.currentCharacter.hp);
        this.updateElement('preview-max-hp', this.currentCharacter.maxHp);

        // Atualiza atributos
        this.updateElement('preview-str', this.currentCharacter.attributes.strength);
        this.updateElement('preview-dex', this.currentCharacter.attributes.dexterity);
        this.updateElement('preview-con', this.currentCharacter.attributes.constitution);
        this.updateElement('preview-int', this.currentCharacter.attributes.intelligence);
        this.updateElement('preview-wis', this.currentCharacter.attributes.wisdom);
        this.updateElement('preview-cha', this.currentCharacter.attributes.charisma);

        // Atualiza avatar baseado em gênero/classe
        this.updateAvatar();
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
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

    updateAvatar() {
        const avatar = document.querySelector('.avatar-placeholder i');
        if (!avatar) return;

        const gender = this.currentCharacter.appearance.gender;
        const className = this.currentCharacter.class;

        // Define ícone baseado em gênero e classe
        const icons = {
            'warrior': gender === 'female' ? 'fas fa-female' : 'fas fa-male',
            'mage': 'fas fa-hat-wizard',
            'rogue': 'fas fa-user-ninja',
            'cleric': 'fas fa-pray',
            'ranger': 'fas fa-leaf',
            'bard': 'fas fa-music'
        };

        avatar.className = icons[className] || 'fas fa-user';
    }

    // ============ FUNÇÕES DE AÇÃO ============

    saveCharacter() {
        // Validação básica
        if (!this.currentCharacter.name || this.currentCharacter.name.trim() === '') {
            alert('Por favor, digite um nome para o personagem!');
            document.getElementById('char-name')?.focus();
            return;
        }

        if (this.attributePoints !== 0) {
            if (!confirm(`Você ainda tem ${this.attributePoints} pontos não distribuídos. Deseja salvar mesmo assim?`)) {
                return;
            }
        }

        // Atualiza timestamp
        this.currentCharacter.lastModified = new Date().toISOString();

        // Salva no sistema
        const characterId = window.saveCharacter?.(this.currentCharacter) || this.saveToLocalStorage();

        // Feedback visual
        const saveBtn = document.getElementById('save-character');
        if (saveBtn) {
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Salvo!';
            saveBtn.style.background = '#4cd964';

            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.style.background = '';
            }, 2000);
        }

        // Feedback ao usuário
        alert(`Personagem "${this.currentCharacter.name}" salvo com sucesso!`);

        // Opcional: redireciona para a página principal
        // setTimeout(() => {
        //     window.location.href = '../index.html';
        // }, 1500);
    }

    exportCharacter() {
        // Cria uma cópia limpa para exportação
        const exportData = {
            ...this.currentCharacter,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        // Converte para JSON
        const jsonString = JSON.stringify(exportData, null, 2);

        // Cria blob e link para download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = `personagem_${this.currentCharacter.name}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Personagem exportado com sucesso!');
    }

    randomizeCharacter() {
        if (!confirm('Isso irá substituir todas as configurações atuais. Continuar?')) {
            return;
        }

        // Nomes aleatórios
        const names = ['Aragorn', 'Legolas', 'Gandalf', 'Frodo', 'Gimli', 'Boromir', 'Galadriel', 'Arwen', 'Elrond', 'Thorin'];
        const races = ['human', 'elf', 'dwarf', 'halfling', 'orc', 'dragonborn'];
        const classes = ['warrior', 'mage', 'rogue', 'cleric', 'ranger', 'bard'];

        // Atribui valores aleatórios
        this.currentCharacter.name = names[Math.floor(Math.random() * names.length)];
        this.currentCharacter.race = races[Math.floor(Math.random() * races.length)];
        this.currentCharacter.class = classes[Math.floor(Math.random() * classes.length)];
        this.currentCharacter.background = 'Um aventureiro destemido em busca de glória e riquezas.';

        // Atributos aleatórios (usando sistema de pontos)
        this.attributePoints = 27;
        const attributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

        attributes.forEach(attr => {
            this.currentCharacter.attributes[attr] = 8; // Mínimo
        });

        // Distribui pontos aleatoriamente
        while (this.attributePoints > 0) {
            const randomAttr = attributes[Math.floor(Math.random() * attributes.length)];
            const currentValue = this.currentCharacter.attributes[randomAttr];

            if (currentValue < 18) {
                const cost = currentValue >= 13 ? 2 : 1;
                if (this.attributePoints >= cost) {
                    this.currentCharacter.attributes[randomAttr]++;
                    this.attributePoints -= cost;
                }
            }
        }

        // Perícias aleatórias (2-4)
        this.currentCharacter.skills = [];
        const availableSkills = [...this.skills];
        const numSkills = Math.floor(Math.random() * 3) + 2;

        for (let i = 0; i < numSkills; i++) {
            if (availableSkills.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableSkills.length);
                const skill = availableSkills.splice(randomIndex, 1)[0];
                this.currentCharacter.skills.push(skill.id);
            }
        }

        // Aparência aleatória
        this.currentCharacter.appearance = {
            gender: Math.random() > 0.5 ? 'male' : 'female',
            age: Math.floor(Math.random() * 50) + 18,
            height: Math.floor(Math.random() * 40) + 150,
            weight: Math.floor(Math.random() * 40) + 50,
            description: 'Uma figura imponente com olhar determinado.'
        };

        // Atualiza tudo
        this.updateAllDisplays();
        this.updateCalculatedStats();
        this.updatePreview();
        this.saveToLocalStorage();

        alert('Personagem randomizado com sucesso!');
    }

    resetCharacter() {
        if (!confirm('Isso irá resetar todos os campos para os valores padrão. Continuar?')) {
            return;
        }

        this.currentCharacter = this.getDefaultCharacter();
        this.attributePoints = 27;
        this.updateAllDisplays();
        this.updateCalculatedStats();
        this.updatePreview();
        this.saveToLocalStorage();

        alert('Personagem resetado para os valores padrão!');
    }

    updateAllDisplays() {
        // Atualiza todos os campos do formulário
        this.setupBasicInputs();
        this.setupAttributes();
        this.setupSkills();
        this.setupAppearance();
        this.renderInventory();
    }

    // ============ FUNÇÕES DE ARMAZENAMENTO ============

    saveToLocalStorage() {
        // Salva rascunho no localStorage
        localStorage.setItem('characterDraft', JSON.stringify({
            character: this.currentCharacter,
            attributePoints: this.attributePoints,
            timestamp: new Date().toISOString()
        }));

        return this.currentCharacter.id;
    }

    loadFromLocalStorage() {
        const draft = localStorage.getItem('characterDraft');
        if (draft) {
            try {
                const data = JSON.parse(draft);
                this.currentCharacter = data.character || this.getDefaultCharacter();
                this.attributePoints = data.attributePoints || 27;
                return true;
            } catch (e) {
                console.error('Erro ao carregar rascunho:', e);
            }
        }
        return false;
    }

    loadCharacterForEdit() {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');

        if (editId) {
            // Tenta carregar do localStorage
            const savedCharacters = JSON.parse(localStorage.getItem('rpgCharacters')) || [];
            const character = savedCharacters.find(char => char.id == editId);

            if (character) {
                this.currentCharacter = character;
                this.attributePoints = 0; // Já distribuídos
                return true;
            }
        }

        // Tenta carregar rascunho
        return this.loadFromLocalStorage();
    }

    setupAutoSave() {
        // Auto-save a cada 30 segundos
        setInterval(() => {
            if (this.currentCharacter.name && this.currentCharacter.name.trim() !== '') {
                this.saveToLocalStorage();
                console.log('Auto-save realizado');
            }
        }, 30000);

        // Auto-save ao sair da página
        window.addEventListener('beforeunload', () => {
            if (this.currentCharacter.name && this.currentCharacter.name.trim() !== '') {
                this.saveToLocalStorage();
            }
        });
    }

    // ============ FUNÇÕES DE MODAL ============

    showModal(content) {
        let modal = document.getElementById('item-modal');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'item-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                ${content}
            </div>
        `;

        modal.style.display = 'flex';

        // Fecha modal ao clicar no X
        modal.querySelector('.close-modal').addEventListener('click', () => {
            this.hideModal();
        });

        // Fecha modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });
    }

    hideModal() {
        const modal = document.getElementById('item-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Inicializa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function () {
    // Verifica se estamos na página de criação
    if (document.querySelector('.creator-container')) {
        window.characterCreator = new CharacterCreator();
    }
});

// Adiciona estilos dinâmicos
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
    .attribute-mod {
        font-size: 0.9rem;
        color: #a0c4ff;
        margin-bottom: 5px;
    }
    
    .skill-checkbox {
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
    }
    
    .skill-item.selected .skill-checkbox {
        background: #4cd964;
    }
    
    .skill-info {
        flex: 1;
    }
    
    .skill-name {
        font-weight: 500;
        margin-bottom: 3px;
    }
    
    .skill-details {
        display: flex;
        gap: 10px;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
    }
    
    .skill-attr {
        background: rgba(84, 150, 242, 0.2);
        padding: 2px 8px;
        border-radius: 10px;
    }
    
    .skill-mod {
        color: #4cd964;
    }
    
    .item-icon {
        font-size: 2rem;
        margin-bottom: 10px;
        color: #5496f2;
    }
    
    .item-name {
        font-weight: 500;
        margin-bottom: 5px;
    }
    
    .item-quantity, .item-weight {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
    }
    
    .inventory-weight {
        text-align: center;
        padding: 15px;
        background: rgba(84, 150, 242, 0.1);
        border-radius: 10px;
        margin-top: 20px;
        border: 1px solid #5496f2;
    }
    
    .modal-actions {
        display: flex;
        gap: 15px;
        margin-top: 25px;
    }
    
    .modal-actions button {
        flex: 1;
        padding: 12px;
        border-radius: 8px;
        border: none;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .btn-primary {
        background: linear-gradient(45deg, #0000f579, #2c3efb36);
        color: white;
    }
    
    .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
    }
    
    .btn-primary:hover, .btn-secondary:hover {
        transform: translateY(-2px);
    }
`;

document.head.appendChild(dynamicStyles);