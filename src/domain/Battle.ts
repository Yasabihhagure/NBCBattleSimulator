import type { Team, MoraleCheckResult } from './Team';
import { Member } from './Member';
import type { Weapon } from './Weapon';
import { Dice } from './Dice';
import { MonsterPresets } from './Presets';

export interface BattleLog {
    turn: number;
    message: string;
}

export interface BattleResult {
    winnerTeamIds: string[];
    logs: string[];
    teamStats: Record<string, any>;
    isTimeOut: boolean;
}

export class Battle {
    teams: Team[];
    turnNumber: number = 0;
    logs: string[] = [];
    isGameOver: boolean = false;

    enableKarma: boolean;

    constructor(teams: Team[], enableKarma: boolean = false) {
        this.teams = teams;
        this.enableKarma = enableKarma;
    }

    log(message: string) {
        this.logs.push(`[T${this.turnNumber}] ${message}`);
    }

    private useKarma(actor: Member, reason: string): boolean {
        if (!this.enableKarma || actor.karma <= 0) return false;

        actor.karma--;
        this.log(`【業(Gou)発動】${actor.name} は業を使用した！ (${reason}) 残り業: ${actor.karma}`);
        return true;
    }

    run(): BattleResult {
        this.log("戦闘開始！");

        // Log Initial State
        this.teams.forEach(team => {
            if (team.members.length > 0) {
                this.log(`チーム ${team.id} 参加者:`);
                team.members.forEach(m => {
                    const weaponNames = m.weapons.map(w => {
                        return w.ammo >= 0 ? `${w.name}(${w.ammo})` : w.name;
                    }).join(', ');
                    const armorInfo = m.armorRoll ? `防具: ${m.armorRoll}` : `防具: LV${m.armorLevel}`;
                    this.log(` - ${m.name} (HP:${m.hp}, ${armorInfo}, 武器: [${weaponNames}])`);
                });
            }
        });

        while (!this.isGameOver && this.turnNumber < 100) {
            this.turnNumber++;
            this.processTurn();
            this.checkWinCondition();
        }

        const isTimeOut = this.turnNumber >= 100;

        if (isTimeOut) {
            this.log("規定ターン数経過のため戦闘終了。");
        }

        const winnerIds = this.getWinningTeams();
        const stats: Record<string, any> = {};
        this.teams.forEach(t => stats[t.id] = t.getStats());

        return {
            winnerTeamIds: winnerIds,
            logs: this.logs,
            teamStats: stats,
            isTimeOut
        };
    }

    private processTurn() {
        this.log(`--- ターン ${this.turnNumber} 開始 ---`);
        const turnOrder = this.determineInitiative();

        for (const team of turnOrder) {
            if (!team.hasActiveMembers()) continue;
            this.processTeamTurn(team);
            this.checkWinCondition();
            if (this.isGameOver) break;
        }

    }

    private determineInitiative(): Team[] {
        const teamRolls = this.teams.map(t => ({ team: t, roll: Dice.roll(1, 6) }));
        teamRolls.sort((a, b) => b.roll - a.roll);
        this.log(`イニシアチブ: ${teamRolls.map(r => `${r.team.id}(${r.roll})`).join(', ')}`);
        return teamRolls.map(r => r.team);
    }

    private processTeamTurn(team: Team) {
        if (!team.hasActiveMembers()) return;
        this.log(`チーム ${team.id} の手番。`);

        // Fix: Interact over Living members to allow Status Recovery for Inactive ones
        const members = team.getLivingMembers();
        for (const member of members) {
            // Handle Start of Turn Status Recovery/Effects
            this.handleStartOfTurnStatus(member);

            if (!member.isActive()) {
                if (member.hasStatus('Roar')) this.log(`${member.name} は恐怖した！(吠える声)`);
                if (member.hasStatus('Paralysis')) this.log(`${member.name} は麻痺している！`);
                // End of Turn processing for inactive members
                this.handleEndOfTurnStatus(member);
                continue;
            }

            member.turnCount++;
            this.processMemberAction(member, team);

            // End of Turn processing
            this.handleEndOfTurnStatus(member);
        }

        this.teams.forEach(t => {
            if (t.id !== 'A' && t.hasActiveMembers()) {
                const check: MoraleCheckResult = t.checkMorale();
                if (check.isChecked) {
                    const rollInfo = `(2D6=${check.roll} vs 士気${check.target})`;
                    const reasons = check.reasons ? `[${check.reasons.join(',')}]` : '';
                    if (check.result !== 'None') {
                        const routMsg = check.result === 'Rout' ? '敗走' : '降伏';
                        this.log(`チーム ${t.id} 士気チェック: ${reasons} ${rollInfo} -> 失敗！ ${routMsg}！`);
                    } else {
                        // Check passed
                        this.log(`チーム ${t.id} 士気チェック: ${reasons} ${rollInfo} -> 成功`);
                    }
                }
            }
        });
    }

    private handleStartOfTurnStatus(actor: Member) {
        // Unconscious Recovery
        if (actor.hasStatus('Unconscious')) {
            const status = actor.getStatus('Unconscious');
            if (status) {
                status.value = (status.value || 0) - 1;
                if (status.value <= 0) {
                    actor.removeStatus('Unconscious');
                    const recoverHp = Dice.roll(1, 4);
                    actor.heal(recoverHp);
                    this.log(`${actor.name} は意識を取り戻した！ (HP+${recoverHp})`);
                } else {
                    this.log(`${actor.name} は意識不明のままだ (残り ${status.value} ターン)...`);
                }
            }
        }

        // Charm Recovery: Heart DR12
        if (actor.hasStatus('Charm')) {
            const statVal = actor.getStat('心');
            const d20 = Dice.roll(1, 20);
            if (d20 + statVal >= 12) {
                this.log(`${actor.name} は魅了を振り払った！ (${d20}+${statVal} >= 12)`);
                actor.removeStatus('Charm');
            } else {
                this.log(`${actor.name} は魅了されている... (${d20}+${statVal} < 12)`);
            }
        }

        // Roar Recovery: Heart DR10
        if (actor.hasStatus('Roar')) {
            const statVal = actor.getStat('心');
            const d20 = Dice.roll(1, 20);
            if (d20 + statVal >= 10) {
                this.log(`${actor.name} は恐怖(吠える声)から立ち直った！以降この効果は無効。`);
                actor.removeStatus('Roar');
                actor.addStatus('RoarImmunity');
            }
        }

        // Paralysis Breath Recovery: Durability DR8
        if (actor.hasStatus('Infection')) {
            const breathStatus = actor.getStatus('Paralysis');
            if (breathStatus && breathStatus.sourceId === 'Breath') {
                const statVal = actor.getStat('耐久');
                const d20 = Dice.roll(1, 20);
                if (d20 + statVal >= 8) {
                    this.log(`${actor.name} は麻痺の吐息から回復した！`);
                    actor.removeStatus('Paralysis');
                } else {
                    this.log(`${actor.name} は麻痺の吐息に苦しんでいる (HP-1)。`);
                    actor.hp -= 1;
                }
            }
        }
    }

    private handleEndOfTurnStatus(actor: Member) {
        // Charm Effect: Heal Inflictor, Damage Victim
        if (actor.hasStatus('Charm')) {
            const status = actor.getStatus('Charm');
            if (status && status.sourceId) {
                // Find inflictor
                let inflictor: Member | undefined;
                this.teams.forEach(t => {
                    const found = t.members.find(m => m.id === status.sourceId);
                    if (found) inflictor = found;
                });

                if (inflictor && inflictor.isAlive()) {
                    this.log(`妖艶の効果: ${inflictor.name} HP+1, ${actor.name} HP-1。`);
                    inflictor.heal(1);
                    const result = this.applyDamageWithKarma(actor, 1, false);
                    this.log(result.log);
                }
            }
        }

        // Paralysis (Standard 1 Turn) Removal
        if (actor.hasStatus('Paralysis')) {
            const status = actor.getStatus('Paralysis');
            if (status && status.sourceId !== 'Breath') {
                actor.removeStatus('Paralysis');
                this.log(`${actor.name} の麻痺が解けた。`);
            }
        }

        // Kick Debuff Removal
        if (actor.hasStatus('KickDebuff')) {
            actor.removeStatus('KickDebuff');
            this.log(`${actor.name} の体勢が戻った。`);
        }
    }

    private processMemberAction(actor: Member, team: Team) {
        const weapon = this.selectWeapon(actor);
        if (!weapon) {
            this.log(`${actor.name} は使用可能な武器がない！`);
            return;
        }

        const targets = this.selectTargets(actor, team, weapon);
        if (targets.length === 0) {
            if (actor.hasStatus('Charm') && team.enemyTeamIds.length > 0) {
                this.log(`${actor.name} は妖艶により攻撃できない！`);
            } else if (team.enemyTeamIds.length > 0) {
                // Log if no valid targets found (e.g. only flying enemies remain)
                const enemiesExist = this.teams.some(t => team.enemyTeamIds.includes(t.id) && t.hasActiveMembers());
                if (enemiesExist) {
                    this.log(`${actor.name} は攻撃対象を見つけられない (飛翔体など)。`);
                }
            }
            return;
        }

        // Record Action for Flight Logic
        actor.lastAction = { weaponName: weapon.name, targetIds: targets.map(t => t.id) };

        // Determine Attack Count
        let count = 1;
        if (weapon.attackCount) {
            count = Dice.parseAndRoll(weapon.attackCount);
        }

        for (let i = 0; i < count; i++) {
            if (weapon.ammo > 0) {
                weapon.ammo--;
            } else if (weapon.ammo === 0) {
                this.log(`${actor.name} の ${weapon.name} は弾切れだ！`);
                break;
            }
            for (const target of targets) {
                if (!actor.isActive()) break;
                if (!target.isAlive()) break;

                // Handle Always Effects (Pre-Attack)
                if (weapon.specialEffect === '回復') {
                    const healAmount = Dice.roll(1, 6);
                    const log = actor.heal(healAmount);
                    this.log(log);
                }

                // Roar Effect (Before Attack? Spec says "攻撃時に")
                if (weapon.specialEffect === '吠える声') {
                    this.applyRoarEffect(actor, team);
                }

                this.executeInteraction(actor, target, weapon);
            }
        }
    }

    private applyRoarEffect(actor: Member, actorTeam: Team) {
        this.log(`${actor.name} は敵を恐れさせようと吠えた！`);
        // All enemy teams
        actorTeam.enemyTeamIds.forEach(eid => {
            const enemyTeam = this.teams.find(t => t.id === eid);
            if (enemyTeam) {
                enemyTeam.getActiveMembers().forEach(enemy => {
                    if (enemy.hasStatus('RoarImmunity')) return; // Check Immunity

                    const statVal = enemy.getStat('心');
                    const d20 = Dice.roll(1, 20);
                    if (d20 + statVal < 10) {
                        this.log(`${enemy.name} は恐怖した！(吠える声) (${d20}+${statVal} < 10)`);
                        enemy.addStatus('Roar');
                    }
                });
            }
        });
    }

    private selectWeapon(actor: Member): Weapon | null {
        const usableWeapons = actor.weapons.filter(w => !w.isBroken && w.ammo !== 0);
        if (usableWeapons.length === 0) {
            if (actor.type !== 'Humanoid') {
                return null;
            }
        }

        if (actor.type === 'Humanoid') {
            const valid = usableWeapons.filter(w => !!w.hitStat);
            if (valid.length === 0) {
                // Unarmed Fallback
                const unarmed: Weapon = {
                    name: "素手",
                    type: 'Melee',
                    hitStat: '体',
                    targetHitStat: '技DR12',
                    damageNotation: '1D2',
                    ammo: -1,
                    isBroken: false,
                    usageType: 'Random'
                };
                return unarmed;
            }
            return valid[Math.floor(Math.random() * valid.length)] || null;
        }

        // Monster Interaction logic
        if (actor.turnCount === 1) {
            const w0 = usableWeapons.find(w => w.usageType === 'FirstTurn');
            if (w0) return w0;
        }

        const seqWeapons = usableWeapons.filter(w => w.usageType === 'Sequential');
        if (seqWeapons.length > 0) {
            const maxSeq = Math.max(...seqWeapons.map(w => w.seqIndex || 1));
            let cycleTurn = actor.turnCount;
            const hasZero = usableWeapons.some(w => w.usageType === 'FirstTurn');
            if (hasZero) {
                if (actor.turnCount === 1) return usableWeapons.find(w => w.usageType === 'FirstTurn') || seqWeapons[0];
                cycleTurn -= 1;
            }

            let seqNum = (cycleTurn - 1) % maxSeq + 1;
            return seqWeapons.find(w => w.seqIndex === seqNum) || seqWeapons[0];
        }

        return usableWeapons[0] || null;
    }

    private selectTargets(actor: Member, team: Team, weapon: Weapon): Member[] {
        const enemyIds = team.enemyTeamIds;
        let candidates: Member[] = [];

        this.teams.forEach(t => {
            if (enemyIds.includes(t.id)) {
                // Select from LIVING members, not just active ones. Unconscious targets are valid victims.
                // But routed members are gone, so exclude them.
                candidates.push(...t.members.filter(m => m.isAlive() && !m.hasStatus('Rout')));
            }
        });

        // Filter based on "Flight" (飛翔体) logic for Karasu Tengu
        candidates = candidates.filter(target => {
            if (target.name !== "烏天狗") return true;

            // Ranged weapons always hit Flying targets
            if (weapon.type === 'Ranged') return true;

            // Melee weapons only hit if Tengu used '義経流霞の太刀' on this attacker immediately before
            if (target.lastAction?.weaponName === "義経流霞の太刀" && target.lastAction.targetIds.includes(actor.id)) {
                return true;
            }

            return false;
        });

        if (actor.hasStatus('Charm')) {
            const charmStatus = actor.getStatus('Charm');
            if (charmStatus && charmStatus.sourceId) {
                candidates = candidates.filter(c => c.id !== charmStatus.sourceId);
            }
        }

        if (candidates.length === 0) return [];

        // Target Strategy Logic
        if (actor.targetStrategy === 'HighHP') {
            // Sort Descending HP
            candidates.sort((a, b) => b.hp - a.hp);
            // KIV: Random among ties?
            // Filter to only those with max HP
            const maxHp = candidates[0].hp;
            candidates = candidates.filter(c => c.hp === maxHp);
        } else if (actor.targetStrategy === 'LowHP') {
            // Sort Ascending HP
            candidates.sort((a, b) => a.hp - b.hp);
            const minHp = candidates[0].hp;
            candidates = candidates.filter(c => c.hp === minHp);
        }

        const target = candidates[Math.floor(Math.random() * candidates.length)];
        return [target];
    }

    private executeInteraction(actor: Member, target: Member, weapon: Weapon) {
        if (actor.type === 'Humanoid') {
            this.executeHumanoidAttack(actor, target, weapon);
        } else {
            if (target.type === 'Humanoid') {
                this.executeMonsterAttackWithDefenderRoll(actor, target, weapon);
            } else {
                this.executeStandardAttack(actor, target, weapon);
            }
        }
    }

    private executeHumanoidAttack(actor: Member, target: Member, weapon: Weapon) {
        const ammoLog = weapon.ammo !== -1 ? ` (残弾:${weapon.ammo})` : '';
        this.log(`${actor.name} は ${target.name} を ${weapon.name} で攻撃！${ammoLog}`);

        if (!weapon.hitStat) return;

        const statVal = actor.getStat(weapon.hitStat);
        const d20 = Dice.roll(1, 20);
        const difficulty = 12; // Base difficulty
        let total = d20 + statVal;

        let hit = false;
        let crit = false;

        // Karma 3: Cancel Fumble (Utility)
        let isFumble = (d20 === 1);
        if (isFumble && this.useKarma(actor, "ファンブル打消")) {
            isFumble = false;
        }

        // Karma 4: Offense Boost (Ensure Hit)
        // If not crit/fumble and would miss calculate if +4 helps
        if (!isFumble && d20 !== 20 && total < difficulty) {
            if (total + 4 >= difficulty) {
                if (this.useKarma(actor, "判定+4")) {
                    total += 4;
                }
            }
        }

        if (d20 === 20) {
            crit = true;
            hit = true;
            this.log("クリティカルヒット！ (出目 20)");
        } else if (isFumble) {
            hit = false;
            this.log("ファンブル！ (出目 1)");
            weapon.isBroken = true;
            this.log(`${weapon.name} が破損した！`);
        } else {
            hit = total >= difficulty;
        }

        if (hit) {
            let dmgRoll = Dice.parseAndRoll(weapon.damageNotation);

            // Karma 5: Maximize Damage (Secure Kill)
            // Check if max damage could kill target (heuristic)
            // Parsing notation for Max is hard without helper. Assume "Kill Secure" logic is:
            // If target HP is "low" (<=5) and we hit, use Karma to Maximize? 
            // Spec says "Maximize Damage". Let's use it if target is likely to die.
            if (target.hp <= 5 && target.hp > 0 && !crit) { // Only if not crit (crit is already strong)
                if (this.useKarma(actor, "ダメージ最大化")) {
                    // Hacky: Re-roll? Or just set high?
                    // Dice.parseAndRoll doesn't support Max.
                    // Simple approach: Add +10 to damage? Or set to 10?
                    // Let's just treat it as high roll.
                    dmgRoll = 10; // Placeholder for Max. Ideally parse '1D10' -> 10.
                    // Better: Parse notation and take max.
                    // weapon.damageNotation "1D10" -> 10. "1D8+1" -> 9.
                    // Quick parse:
                    if (weapon.damageNotation.includes('D')) {
                        const parts = weapon.damageNotation.split('D');
                        const faces = parseInt(parts[1]) || 6;
                        const count = parseInt(parts[0]) || 1;
                        // Handle +X ??
                        dmgRoll = count * faces;
                    } else {
                        dmgRoll = parseInt(weapon.damageNotation) || dmgRoll;
                    }
                }
            }

            if (crit) dmgRoll *= 2;
            const result = this.applyDamageWithKarma(target, dmgRoll, crit);
            this.log(result.log);

            this.applyWeaponStatusEffect(actor, target, weapon, result.finalDamage);
            this.checkOnDeathTriggers(target);
        } else {
            this.log(`攻撃失敗！ (出目: ${d20} + ${statVal} = ${total} < ${difficulty})`);
        }
    }

    private executeMonsterAttackWithDefenderRoll(actor: Member, target: Member, weapon: Weapon) {
        const ammoLog = weapon.ammo !== -1 ? ` (残弾:${weapon.ammo})` : '';
        if (weapon.targetHitStat && weapon.targetHitStat !== '常に') {
            this.log(`${actor.name} は ${target.name} を ${weapon.name} で攻撃！${ammoLog}`);
        }

        if (!weapon.targetHitStat) {
            this.executeStandardAttack(actor, target, weapon);
            return;
        }

        let statKey = "技";
        let diff = 12;

        if (weapon.targetHitStat.includes("DR")) {
            const parts = weapon.targetHitStat.split("DR");
            statKey = parts[0];
            diff = parseInt(parts[1]) || 12;
        }

        if (weapon.targetHitStat === '常に') {
            let dmgRoll = 0;
            if (weapon.damageNotation && weapon.damageNotation !== '0') {
                this.log(`${actor.name} は ${target.name} を ${weapon.name} で攻撃！(必中)`);
                dmgRoll = Dice.parseAndRoll(weapon.damageNotation);
            }

            const result = this.applyDamageWithKarma(target, dmgRoll, false);
            this.log(result.log);
            this.applyWeaponStatusEffect(actor, target, weapon, result.finalDamage);
            return;
        }

        const statVal = target.getStat(statKey);
        const d20 = Dice.roll(1, 20);
        const total = d20 + statVal;

        let success = false;
        let crit = false;
        let fumble = false;

        this.log(`${target.name} の防御判定 (${statKey} vs ${diff}). 出目: ${d20}+${statVal}=${total}`);

        if (d20 === 20) {
            crit = true;
            success = true;
            this.log("防御クリティカル！ カウンター攻撃のチャンス！");
        } else if (d20 === 1) {
            fumble = true;
            success = false;
            this.log("防御ファンブル！ ダメージ2倍、防具レベル-1。");
            // Spear Infection on Fumble
            if (weapon.specialEffect === '槍からの感染') {
                target.addStatus('Infection');
                this.log(`${target.name} は防御ファンブルにより槍から感染した！`);
            }
        } else {
            success = total >= diff;
        }

        if (success) {
            this.log(`${target.name} 防御成功！`);
            if (crit) {
                this.log(`*** ${target.name} のカウンター攻撃！ ***`);
                const counterWeapon = this.selectWeapon(target);
                if (counterWeapon) {
                    this.executeHumanoidAttack(target, actor, counterWeapon);
                }
            }
        } else {
            let dmgRoll = 0;
            if (weapon.specialEffect === '被命中判定不足分ダメージ') {
                dmgRoll = Math.max(0, diff - total);
            } else {
                dmgRoll = Dice.parseAndRoll(weapon.damageNotation);
            }

            if (fumble) dmgRoll *= 2;
            const result = this.applyDamageWithKarma(target, dmgRoll, fumble);
            this.log(result.log);

            this.applyWeaponStatusEffect(actor, target, weapon, result.finalDamage);
            this.checkOnDeathTriggers(target);
        }
    }

    private executeStandardAttack(actor: Member, target: Member, weapon: Weapon) {
        const ammoLog = weapon.ammo !== -1 ? ` (残弾:${weapon.ammo})` : '';
        this.log(`${actor.name} は ${target.name} を ${weapon.name} で攻撃！${ammoLog}`);
        const d20 = Dice.roll(1, 20);
        let hit = d20 >= 12;
        let crit = d20 === 20;

        if (hit) {
            let dmgRoll = Dice.parseAndRoll(weapon.damageNotation);
            if (crit) dmgRoll *= 2;
            const result = this.applyDamageWithKarma(target, dmgRoll, crit);
            this.log(result.log);
            this.applyWeaponStatusEffect(actor, target, weapon, result.finalDamage);
            this.checkOnDeathTriggers(target);
        } else {
            this.log(`攻撃失敗！ (出目: ${d20} < 12)`);
        }
    }

    private applyWeaponStatusEffect(attacker: Member, target: Member, weapon: Weapon, damageDealt: number) {
        if (!weapon.specialEffect) return;

        switch (weapon.specialEffect) {
            case '妖艶状態': // Charm
                target.addStatus('Charm', attacker.id);
                this.log(`${target.name} は魅了された！`);
                break;
            case '麻痺１ターン': // Paralysis
                target.addStatus('Paralysis');
                this.log(`${target.name} は麻痺した！`);
                break;
            case '尻子玉': // Shirikodama (Sumo)
                // Condition: Damage > 0, Durability DR15
                if (damageDealt > 0) {
                    const statVal = target.getStat('耐久');
                    const d20 = Dice.roll(1, 20);
                    if (d20 + statVal < 15) {
                        target.addStatus('Shirikodama', attacker.id, 1);
                        target.statModifiers['耐久'] = (target.statModifiers['耐久'] || 0) - 1;
                        this.log(`${target.name} は尻子玉を抜かれた！ 耐久-1。 (${d20}+${statVal} < 15)`);

                        // Check Death (-4 Durability from this)
                        const stacks = target.getStatus('Shirikodama')?.value || 0;
                        if (stacks >= 4) {
                            target.addStatus('Dead');
                            let deathLog = `${target.name} は全ての尻子玉を失い(耐久-4)絶命した！`;
                            if (this.isLeader(target)) deathLog = `【大将】${deathLog}`;
                            this.log(deathLog);
                        }
                    }
                }
                break;
            case '宇宙の深淵': // Abyss (Black Tea)
                // HP +2, then Heart DR15. Fail -> 1D6 Dmg.
                target.heal(2);
                const abyssStat = target.getStat('心');
                const abyssRoll = Dice.roll(1, 20);
                if (abyssRoll + abyssStat < 15) {
                    const dmg = Dice.roll(1, 6);
                    this.log(`宇宙の深淵が ${target.name} を飲み込む！ (${abyssRoll}+${abyssStat} < 15) ${dmg} ダメージ。`);
                    const result = this.applyDamageWithKarma(target, dmg, false);
                    this.log(result.log);
                } else {
                    this.log(`${target.name} は深淵を覗き込んだが耐えた。`);
                }
                break;
            case '麻痺の吐息': // Paralysis Breath (Ghost)
                {
                    const statVal = target.getStat('耐久');
                    const d20 = Dice.roll(1, 20);
                    if (d20 + statVal < 8) {
                        target.addStatus('Paralysis', 'Breath');
                        this.log(`${target.name} は吐息により麻痺した！`);
                    }
                }
                break;
            case '禿ネズミの感染': // Rat Infection
                if (damageDealt > 0) {
                    const statVal = target.getStat('耐久');
                    const d20 = Dice.roll(1, 20);
                    if (d20 + statVal < 15) {
                        target.addStatus('Infection');
                        target.addStatus('Rout'); // Rout? Spec: "感染","敗走"
                        this.log(`${target.name} は感染し、パニックに陥った！`);
                    }
                }
                break;
            case '信長の攻撃':
                if (damageDealt > 0) {
                    const statVal = target.getStat('心');
                    const d20 = Dice.roll(1, 20);
                    if (d20 + statVal < 15) {
                        target.addStatus('Rout');
                        this.log(`${target.name} は信長の威圧により敗走した！`);
                    }
                }
                break;
            case '槍からの感染': // Spear Infection
                // Handled in Defense Fumble usually, but spec also implies "On Hit"?
                // Spec says: [発動条件]:防御DRでファンブル
                // So hitting NORMALLY doesn't trigger it.
                break;
            case '蹴りによる効果': // Kick
                if (damageDealt >= 0) { // Hit
                    const statVal = target.getStat('体');
                    const d20 = Dice.roll(1, 20);
                    if (d20 + statVal < 8) {
                        target.addStatus('KickDebuff');
                        this.log(`${target.name} は蹴りで体勢を崩した！ (判定-2)`);
                    }
                }
                break;
            case '舐めて回復': // Lick
                attacker.heal(1);
                this.log(`${attacker.name} は舐めて1HP回復した。`);
                break;
            case '装備外し': // Unequip
                this.log(target.dropEquipment());
                break;
            case '舞につられる': // Dance
                target.addStatus('DanceSeduced');
                this.log(`${target.name} は舞に魅了された！ (判定-3)`);
                break;
            case '足軽ファランクス召喚':
                {
                    const newMember = MonsterPresets["足軽ファランクス"]();
                    // Customize HP: 1D6+4 instead of 2D6+8
                    const hp = Dice.roll(1, 6) + 4;
                    newMember.hp = hp;
                    newMember.maxHp = hp;

                    // Add to attacker's team
                    const team = this.teams.find(t => t.members.some(m => m.id === attacker.id));
                    if (team) {
                        // Naming logic: Ashigaru Phalanx-N
                        const baseName = "足軽ファランクス";
                        const existing = team.members.filter(m => m.name.startsWith(baseName));
                        let nextNum = 1;
                        existing.forEach(m => {
                            const match = m.name.match(/足軽ファランクス-(\d+)/);
                            if (match) {
                                const n = parseInt(match[1]);
                                if (n >= nextNum) nextNum = n + 1;
                            } else if (m.name === baseName) {
                                // If unnumbered exists, next should be at least 2
                                if (nextNum <= 1) nextNum = 2;
                            }
                        });
                        newMember.name = `${baseName}-${nextNum}`;

                        team.members.push(newMember);
                        this.log(`【召喚】戦象の死人踊りで ${newMember.name}(HP:${hp}) が現れた！`);
                    }
                }
                break;
        }
    }

    private isLeader(member: Member): boolean {
        const team = this.teams.find(t => t.members.some(m => m.id === member.id));
        if (!team || team.members.length === 0) return false;
        return team.members[0].id === member.id;
    }

    private applyDamageWithKarma(target: Member, damage: number, isCritical: boolean): { log: string, finalDamage: number } {
        if (target.type === 'Humanoid') {
            // Karma 2: Cancel Critical
            if (isCritical && target.karma > 0) {
                if (this.useKarma(target, "クリティカル打消")) {
                    isCritical = false;
                    damage = Math.floor(damage / 2); // Revert double damage
                    this.log(`${target.name} は急所を避けた！ (クリティカル無効化)`);
                }
            }

            // Karma 1: Reduce Damage
            // Heuristic: If damage is likely to kill?
            if (damage >= target.hp && target.karma > 0) {
                if (this.useKarma(target, "ダメージ軽減")) {
                    const reduceRoll = Dice.roll(1, 6);
                    damage = Math.max(0, damage - reduceRoll);
                    this.log(`${target.name} は食いしばった！ ダメージ-${reduceRoll}。`);
                }
            }
        } else if (target.name === '亡霊武者') {
            // Ghost Samurai Ability: Damage from any source is always 1 (unless 0)
            if (damage > 0) {
                damage = 1;
            }
        }

        const result = target.takeDamage(damage, isCritical);

        // Highlight Leader
        if (this.isLeader(target)) {
            result.log = `【大将】${result.log}`;
        }

        // 足軽兎の士気（1ダメージでも受ければグループ全員敗走）
        if (target.name.startsWith('足軽兎') && result.finalDamage >= 1) {
            if (this.handleAshigaruRabbitRout(target)) {
                result.log += ` 仲間の悲鳴を聞き、足軽兎たちは一目散に逃げ出した！(全員敗走)`;
            }
        }

        return result;
    }

    private handleAshigaruRabbitRout(triggerMember: Member): boolean {
        const team = this.teams.find(t => t.members.some(m => m.id === triggerMember.id));
        if (!team) return false;

        const rabbits = team.members.filter(m => m.name.startsWith('足軽兎') && m.isAlive() && !m.hasStatus('Rout'));
        if (rabbits.length === 0) return false;

        rabbits.forEach(r => {
            r.addStatus('Rout');
        });
        return true;
    }

    private checkWinCondition() {
        const activeTeams = this.teams.filter(t => t.hasActiveMembers());
        if (activeTeams.length <= 1) {
            this.isGameOver = true;
        }
    }

    private getWinningTeams(): string[] {
        return this.teams.filter(t => t.hasActiveMembers()).map(t => t.id);
    }

    private checkOnDeathTriggers(victim: Member) {
        if (victim.isAlive() || !victim.hasStatus('Dead')) return;

        // Check for OnDeath Trigger weapons
        const deathWeapons = victim.weapons.filter(w => w.usageType === 'OnDeath');
        if (deathWeapons.length === 0) return;

        this.log(`${victim.name} の死亡時効果が発動！`);

        for (const weapon of deathWeapons) {
            // Find targets (All Enemies)
            // Need a way to get Team of victim to find enemies.
            const victimTeam = this.teams.find(t => t.members.some(m => m.id === victim.id));
            if (!victimTeam) continue;

            const enemyTeamIds = victimTeam.enemyTeamIds;
            const enemyTeams = this.teams.filter(t => enemyTeamIds.includes(t.id));

            let targets: Member[] = [];
            enemyTeams.forEach(t => {
                targets.push(...t.getLivingMembers()); // Or all members? Spec says "All Enemies". Probably Living.
            });

            this.log(`${victim.name} の ${weapon.name}！ (対象: ${targets.length}体)`);

            for (const target of targets) {
                this.executeInteraction(victim, target, weapon);
            }
        }
    }
}
