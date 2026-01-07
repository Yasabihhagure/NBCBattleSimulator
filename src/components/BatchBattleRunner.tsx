import { useState, useRef } from 'react';
import { Simulator } from '../domain/Simulator';
import { Team } from '../domain/Team';
import { createHumanoid, MonsterPresets } from '../domain/Presets';

interface BatchRow {
    trialCount: number;
    teamASize: number;
    monsterName: string;
    monsterCount: number;
}

interface BatchResult extends BatchRow {
    winRateA: number;
    survivalRateA: number;
    winRateB: number;
    fleeRateB: number;
}

export const BatchBattleRunner = () => {
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProcessing(true);
        setProgress("Starting batch process...");

        try {
            const text = await file.text();
            const rows = parseCSV(text);
            const results: BatchResult[] = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                setProgress(`Processing row ${i + 1}/${rows.length}: ${row.monsterName} x${row.monsterCount} (Trials: ${row.trialCount})`);

                // Create Team Factory for this row
                const teamFactory = () => {
                    // Team A: Humans
                    const teamAMembers = [];
                    for (let j = 1; j <= row.teamASize; j++) {
                        teamAMembers.push(createHumanoid(`人間-${j}`));
                    }
                    const teamA = new Team('A', 'Player', teamAMembers, ['B']);
                    teamA.initialMemberCount = teamAMembers.length;

                    // Team B: Monsters
                    const teamBMembers = [];
                    const monsterFactory = MonsterPresets[row.monsterName];
                    if (!monsterFactory) {
                        throw new Error(`Unknown monster: ${row.monsterName}`);
                    }

                    for (let j = 1; j <= row.monsterCount; j++) {
                        const m = monsterFactory();
                        // Assign unique names if multiple?
                        m.name = row.monsterCount > 1 ? `${row.monsterName} ${j}` : row.monsterName;
                        teamBMembers.push(m);
                    }
                    const teamB = new Team('B', 'NPC', teamBMembers, ['A']);
                    teamB.initialMemberCount = teamBMembers.length;

                    return [teamA, teamB];
                };

                const sim = new Simulator([]); // Empty init, we use factory
                // Run simulation
                // Yield to event loop to allow UI updates
                await new Promise(r => setTimeout(r, 10));

                const simResult = await sim.run(row.trialCount, teamFactory, false); // Default karma false

                results.push({
                    ...row,
                    winRateA: simResult.winRates['A'] || 0,
                    survivalRateA: simResult.avgSurvivalRates['A'] || 0,
                    winRateB: simResult.winRates['B'] || 0,
                    fleeRateB: simResult.avgFleeRates['B'] || 0
                });
            }

            setProgress("Generating CSV...");
            const csvContent = generateCSV(results);
            downloadCSV(csvContent);
            setProgress("Completed!");

        } catch (err) {
            console.error(err);
            setProgress(`Error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setProcessing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    const parseCSV = (text: string): BatchRow[] => {
        const lines = text.split(/\r?\n/);
        const data: BatchRow[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            // Format: TrialCount,TeamASize,TeamBMonsterName,TeamBMonsterCount
            const parts = trimmed.split(',').map(s => s.trim());
            if (parts.length < 4) continue;

            const trialCount = parseInt(parts[0], 10);
            const teamASize = parseInt(parts[1], 10);
            const monsterName = parts[2];
            const monsterCount = parseInt(parts[3], 10);

            if (isNaN(trialCount) || isNaN(teamASize) || isNaN(monsterCount)) continue;

            data.push({ trialCount, teamASize, monsterName, monsterCount });
        }
        return data;
    };

    const generateCSV = (results: BatchResult[]): string => {
        // Spec: 試行回数,チームAの人数,チームBのモンスター名,チームBのモンスター数,チームAの勝率,チームAの生存率,チームBの勝率,チームBの敗走/逃走率
        const lines = [
            "# 試行回数,チームAの人数,チームBのモンスター名,チームBのモンスター数,チームAの勝率,チームAの生存率,チームBの勝率,チームBの敗走/逃走率"
        ];

        for (const r of results) {
            lines.push(`${r.trialCount},${r.teamASize},${r.monsterName},${r.monsterCount},${r.winRateA.toFixed(4)},${r.survivalRateA.toFixed(4)},${r.winRateB.toFixed(4)},${r.fleeRateB.toFixed(4)}`);
        }

        return lines.join('\n');
    };

    const downloadCSV = (content: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `battle_results_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📊</span> バッチ戦闘シミュレーション
            </h2>

            <div className="space-y-4">
                <div className="text-sm text-gray-300">
                    <p>戦闘条件CSVファイルをアップロードして一括実行します。</p>
                    <p className="mt-1 text-gray-400 text-xs">フォーマット: 試行回数,チームA人数,敵モンスター名,敵モンスター数</p>
                </div>

                <div className="flex gap-4 items-center">
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={processing}
                        className="block w-full text-sm text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-600 file:text-white
                            hover:file:bg-blue-700
                            disabled:opacity-50"
                    />
                </div>

                {processing && (
                    <div className="bg-gray-900 p-3 rounded border border-gray-700 text-yellow-400 font-mono text-sm animate-pulse">
                        {progress}
                    </div>
                )}

                {!processing && progress && (
                    <div className={`bg-gray-900 p-3 rounded border border-gray-700 font-mono text-sm ${progress.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                        {progress}
                    </div>
                )}
            </div>
        </div>
    );
};
