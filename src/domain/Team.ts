import { Member } from './Member';
import { Dice } from './Dice';

export type TeamId = 'A' | 'B' | 'C' | 'D';
export type TeamType = 'Player' | 'NPC';
export type RoutResult = 'None' | 'Rout' | 'Surrender';
export interface MoraleCheckResult {
    result: RoutResult;
    isChecked: boolean;
    roll?: number;
    target?: number;
    reasons?: string[];
}

export class Team {
    id: TeamId;
    type: TeamType;
    members: Member[];
    enemyTeamIds: TeamId[];

    initialMemberCount: number;

    isRouted: boolean = false;
    isSurrendered: boolean = false;

    constructor(id: TeamId, type: TeamType, members: Member[], enemyTeamIds: TeamId[]) {
        this.id = id;
        this.type = type;
        this.members = members;
        this.enemyTeamIds = enemyTeamIds;
        this.initialMemberCount = members.length;
    }

    getLivingMembers(): Member[] {
        return this.members.filter(m => m.isAlive() && !m.hasStatus('Rout'));
    }

    getActiveMembers(): Member[] {
        return this.members.filter(m => m.isActive());
    }

    hasActiveMembers(): boolean {
        return this.getLivingMembers().length > 0 && !this.isRouted && !this.isSurrendered;
    }

    checkMorale(): MoraleCheckResult {
        if (this.id === 'A') return { result: 'None', isChecked: false };

        if (this.isRouted) return { result: 'Rout', isChecked: false };
        if (this.isSurrendered) return { result: 'Surrender', isChecked: false };

        const living = this.getLivingMembers();

        const leader = this.members[0];
        // Leader considered dead if Dead status OR Routed status (Gone)
        const leaderDead = !leader.isAlive() || leader.hasStatus('Rout');

        const halfDead = living.length <= (this.initialMemberCount / 2);

        let singleMemberLowHp = false;
        if (this.initialMemberCount === 1 && living.length === 1) {
            if (living[0].hp <= (living[0].maxHp * 0.3)) {
                singleMemberLowHp = true;
            }
        }

        if (leaderDead || halfDead || singleMemberLowHp) {
            const reasons: string[] = [];
            if (leaderDead) reasons.push("リーダー死亡");
            if (halfDead) reasons.push("死傷者半数以上");
            if (singleMemberLowHp) reasons.push("HP3割以下");

            return this.performRoutRoll(living, reasons);
        }

        return { result: 'None', isChecked: false };
    }

    private performRoutRoll(livingMembers: Member[], reasons: string[]): MoraleCheckResult {
        const maxMorale = livingMembers.length > 0 ? Math.max(...livingMembers.map(m => m.morale)) : 0;
        const roll = Dice.roll(2, 6);

        if (roll > maxMorale) {
            const resultRoll = Dice.roll(1, 6);
            if (resultRoll <= 3) {
                this.isRouted = true;
                return { result: 'Rout', isChecked: true, roll, target: maxMorale, reasons };
            } else {
                this.isSurrendered = true;
                return { result: 'Surrender', isChecked: true, roll, target: maxMorale, reasons };
            }
        }
        return { result: 'None', isChecked: true, roll, target: maxMorale, reasons };
    }

    getStats() {
        // Living on field
        const living = this.getLivingMembers();

        // Count individually routed members
        const individuallyRouted = this.members.filter(m => m.isAlive() && m.hasStatus('Rout')).length;

        // If team routed, everyone remaining fled. + any who already fled.
        const fledCount = (this.isRouted ? living.length : 0) + individuallyRouted;

        // Final survivors on field (not fled)
        const finalCount = this.isRouted ? 0 : living.length;

        return {
            initial: this.initialMemberCount,
            final: finalCount,
            fled: fledCount
        };
    }
}
