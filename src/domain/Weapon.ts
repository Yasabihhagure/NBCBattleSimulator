import { Dice } from './Dice';

export type WeaponType = 'Melee' | 'Ranged' | 'Area' | 'ForceRout';
export type TargetSelectionType = 'Random' | 'HighHP' | 'LowHP' | 'Area' | 'MultiSureKill';

export interface Weapon {
    name: string;
    type: WeaponType;
    hitStat?: string;
    targetHitStat?: string;
    damageNotation: string;
    ammo: number;
    specialEffect?: string;
    usageType?: 'Random' | 'Sequential' | 'FirstTurn' | 'EndTurn' | 'Reserve' | 'OnDeath';
    seqIndex?: number;
    isBroken?: boolean;
    attackCount?: string; // e.g. "1", "2", "1D4"
}

export interface AttackResult {
    hit: boolean;
    damage: number;
    critical?: boolean;
    fumble?: boolean;
    targetId: string;
    message: string;
}

export const WEAPON_TYPES: Record<string, WeaponType> = {
    '近接武器': 'Melee',
    '射撃武器': 'Ranged',
    '範囲武器': 'Area',
    '敗走判定強制': 'ForceRout',
};

export class WeaponFactory {
    static create(
        name: string,
        typeStr: string,
        hitStat: string | undefined,
        targetHitStat: string | undefined,
        damage: string,
        ammo: number | string,
        special?: string,
        count: string = "1"
    ): Weapon {
        let parsedHitStat = undefined;
        if (hitStat && hitStat.includes('DR')) {
            parsedHitStat = hitStat.split('DR')[0];
        }

        return {
            name,
            type: WEAPON_TYPES[typeStr] || 'Melee',
            hitStat: parsedHitStat,
            targetHitStat: targetHitStat,
            damageNotation: damage,
            ammo: typeof ammo === 'string' ? (ammo === '-1' ? -1 : Dice.parseAndRoll(ammo)) : ammo,
            specialEffect: special,
            attackCount: count
        };
    }
}
