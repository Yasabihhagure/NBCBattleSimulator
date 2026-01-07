import { Dice } from './Dice';
import type { Weapon } from './Weapon';

export type MemberType = 'Humanoid' | 'Monster';
// Include 'Charm' (matches 妖艶)
export type StatusType = 'Paralysis' | 'Sleep' | 'Charm' | 'Infection' | 'Rout' | 'Dead' | 'Unconscious' | 'Bleeding' | 'Shirikodama' | 'Roar' | 'DanceSeduced' | 'KickDebuff' | 'RoarImmunity';

export interface ActiveStatus {
    type: StatusType;
    sourceId?: string;
    value?: number; // Usage: Stack count or specific value
}

export interface MemberStats {
    heart: number; // 心
    skill: number; // 技
    body: number; // 体
    durability: number; // 耐久
}

export abstract class Member {
    id: string;
    name: string;
    type: MemberType;
    hp: number;
    maxHp: number;
    morale: number;
    armorLevel: number; // 0-4
    weapons: Weapon[];
    statusEffects: ActiveStatus[] = [];

    // Stat Modifiers
    statModifiers: Record<string, number> = {};
    rollModifiers: number = 0;

    // For Monsters with special armor rules
    armorRoll: string | null = null; // e.g., "-1D6"

    // Combat State
    turnCount: number = 0;
    lastAction?: { weaponName: string, targetIds: string[] };
    karma: number = 2;
    targetStrategy: 'Random' | 'HighHP' | 'LowHP' = 'Random';

    constructor(id: string, name: string, type: MemberType) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.hp = 0;
        this.maxHp = 0;
        this.morale = 0;
        this.armorLevel = 0;
        this.weapons = [];
        this.turnCount = 0;
    }

    abstract takeDamage(amount: number, isCritical: boolean): { log: string, finalDamage: number };
    abstract rollInitiative(): number;
    abstract getStat(statName: string): number; // '体', '心', '技'

    isAlive(): boolean {
        return !this.hasStatus('Dead');
    }

    isActive(): boolean {
        return this.isAlive() && !this.hasStatus('Rout') && !this.hasStatus('Unconscious') && !this.hasStatus('Roar') && !this.hasStatus('Paralysis');
    }

    hasStatus(type: StatusType): boolean {
        return this.statusEffects.some(s => s.type === type);
    }

    getStatus(type: StatusType): ActiveStatus | undefined {
        return this.statusEffects.find(s => s.type === type);
    }

    addStatus(type: StatusType, sourceId?: string, value?: number) {
        const existing = this.getStatus(type);
        if (existing) {
            // Update or Stack? For now just update source/value if provided
            if (sourceId) existing.sourceId = sourceId;
            if (value !== undefined) existing.value = (existing.value || 0) + value;
        } else {
            this.statusEffects.push({ type, sourceId, value });
        }
    }

    removeStatus(type: StatusType) {
        this.statusEffects = this.statusEffects.filter(s => s.type !== type);
    }

    // Applies global roll penalties (Kick, Dance)
    getCheckModifier(): number {
        let mod = this.rollModifiers;
        if (this.hasStatus('KickDebuff')) mod -= 2;
        if (this.hasStatus('DanceSeduced')) mod -= 3;
        return mod;
    }

    dropEquipment(): string {
        if (this.weapons.length > 0) {
            const idx = Math.floor(Math.random() * this.weapons.length);
            const w = this.weapons[idx];
            this.weapons.splice(idx, 1);
            return `${this.name} は武器 ${w.name} を失った！`;
        } else if (this.armorLevel > 0) {
            this.armorLevel = 0;
            return `${this.name} は防具を失った！`;
        }
        return `${this.name} は装備を失おうとしたが何も持っていなかった。`;
    }

    heal(amount: number): string {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        const healed = this.hp - oldHp;
        return `${this.name} は HP を ${healed} 回復した。`;
    }

    getArmorReduction(): number {
        if (this.armorRoll) {
            const roll = Dice.parseAndRoll(this.armorRoll);
            return Math.abs(roll);
        }

        switch (this.armorLevel) {
            case 1: return Dice.roll(1, 2);
            case 2: return Dice.roll(1, 3);
            case 3: return Dice.roll(1, 4);
            case 4: return Dice.roll(1, 6);
            default: return 0;
        }
    }
}

export class Humanoid extends Member {
    stats: MemberStats;

    constructor(id: string, name: string, stats: MemberStats) {
        super(id, name, 'Humanoid');
        this.stats = stats;
        this.maxHp = Math.max(1, Dice.roll(1, 8) + stats.durability);
        this.hp = this.maxHp;
    }

    takeDamage(amount: number, isCritical: boolean): { log: string, finalDamage: number } {
        let reduction = this.getArmorReduction();
        let finalDamage = Math.max(0, amount - reduction);

        this.hp -= finalDamage;
        let log = `${this.name} は ${finalDamage} のダメージを受けた (防具 -${reduction})。 HP: ${this.hp}。`;

        if (isCritical && this.armorLevel > 0) {
            this.armorLevel--;
            log += ` 防具が破損した！ レベル ${this.armorLevel}。`;
        }

        if (this.hp <= 0 && this.isAlive()) {
            log += this.handleDeathDoor();
        }

        return { log, finalDamage };
    }



    rollInitiative(): number {
        return Dice.roll(1, 6) + this.getCheckModifier();
    }

    getStat(statName: string): number {
        let val = 0;
        switch (statName) {
            case '体': val = this.stats.body; break;
            case '心': val = this.stats.heart; break;
            case '技': val = this.stats.skill; break;
            case '耐久': val = this.stats.durability; break;
        }
        return val + (this.statModifiers[statName] || 0) + this.getCheckModifier();
    }

    private handleDeathDoor(): string {
        // HP <= 0 Logic
        if (this.hp <= -1) {
            this.addStatus('Dead');
            return ` ${this.name} は即死した (HP <= -1)。`;
        }

        // HP == 0
        const roll = Dice.roll(1, 4);
        switch (roll) {
            case 1:
            case 2:
                // Rule: Unconscious for 1D4 rounds.
                // We store the duration in the 'value' field of the status.
                const duration = Dice.roll(1, 4);
                this.addStatus('Unconscious', undefined, duration);
                return ` ${this.name} は意識不明になった (出目 ${roll}, ${duration}ターン)。`;
            case 3:
                this.addStatus('Bleeding');
                return ` ${this.name} は出血状態になった (出目 ${roll})。`;
            case 4:
                this.addStatus('Dead');
                return ` ${this.name} は死亡した (出目 ${roll})。`;
        }
        return "";
    }
}

export class Monster extends Member {
    constructor(id: string, name: string, hpStr: string, morale: number, armorStr: string, _armorSpecial: string | null) {
        super(id, name, 'Monster');
        this.maxHp = Dice.parseAndRoll(hpStr);
        this.hp = this.maxHp;
        this.morale = morale;

        if (armorStr.startsWith("LV")) {
            this.armorLevel = parseInt(armorStr.replace("LV", ""), 10);
        } else {
            this.armorRoll = armorStr;
        }
    }

    takeDamage(amount: number, isCritical: boolean): { log: string, finalDamage: number } {
        let reduction = this.getArmorReduction();
        let finalDamage = Math.max(0, amount - reduction);

        this.hp -= finalDamage;
        let log = `${this.name} は ${finalDamage} のダメージを受けた (防具 -${reduction})。 HP: ${this.hp}。`;

        if (isCritical && this.armorLevel > 0) {
            this.armorLevel--;
            log += ` 防具が破損した！ レベル ${this.armorLevel}。`;
        }

        if (this.hp <= 0) {
            this.addStatus('Dead');
            log += ` ${this.name} は倒れた。`;
        }

        return { log, finalDamage };
    }

    rollInitiative(): number {
        return Dice.roll(1, 6) + this.getCheckModifier();
    }

    getStat(_statName: string): number {
        // Monster doesn't typically use stats for offense/defense in same way?
        // But if needed, return 0 or parse from somewhere if added later.
        // For now: 0
        return 0;
    }
}
