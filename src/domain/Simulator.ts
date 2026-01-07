import { Battle } from './Battle';
import { Team } from './Team';
import type { BattleResult } from './Battle'; // Fixed import

export interface SimulationSummary {
    totalBattles: number;
    winCounts: Record<string, number>;
    winRates: Record<string, number>;
    avgSurvivalRates: Record<string, number>;
    avgFleeRates: Record<string, number>;
    timeOutCount: number;
    lastBattleLog: string[];
}

export class Simulator {
    teams: Team[];

    constructor(teams: Team[]) {
        this.teams = teams;
    }

    async run(count: number, teamFactory: () => Team[], enableKarma: boolean = false): Promise<SimulationSummary> {
        const winCounts: Record<string, number> = {};
        const totalSurvivors: Record<string, number> = {};
        const totalInitial: Record<string, number> = {};
        const totalFled: Record<string, number> = {};
        let timeOutCount = 0;

        let lastLog: string[] = [];

        for (let i = 0; i < count; i++) {
            const currentTeams = teamFactory();

            const battle = new Battle(currentTeams, enableKarma);
            const result: BattleResult = battle.run();

            // Win Definition (Spec v6): Winner & Not TimeOut
            if (!result.isTimeOut) {
                result.winnerTeamIds.forEach(id => {
                    winCounts[id] = (winCounts[id] || 0) + 1;
                });
            } else {
                timeOutCount++;
            }

            Object.keys(result.teamStats).forEach(tid => {
                const stats = result.teamStats[tid];
                totalSurvivors[tid] = (totalSurvivors[tid] || 0) + stats.final;
                totalInitial[tid] = (totalInitial[tid] || 0) + stats.initial;
                totalFled[tid] = (totalFled[tid] || 0) + stats.fled;
            });

            if (i === count - 1) {
                lastLog = result.logs;
            }

            if (i % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        const winRates: Record<string, number> = {};
        const avgSurvivalRates: Record<string, number> = {};
        const avgFleeRates: Record<string, number> = {};

        const allIds = Object.keys(totalSurvivors).sort();

        allIds.forEach(id => {
            winRates[id] = (winCounts[id] || 0) / count;

            const initSum = totalInitial[id] || 1;
            avgSurvivalRates[id] = (totalSurvivors[id] || 0) / initSum;
            avgFleeRates[id] = (totalFled[id] || 0) / initSum;
        });

        return {
            totalBattles: count,
            winCounts, // Optional to return counts
            winRates,
            avgSurvivalRates,
            avgFleeRates,
            timeOutCount,
            lastBattleLog: lastLog
        };
    }
}
