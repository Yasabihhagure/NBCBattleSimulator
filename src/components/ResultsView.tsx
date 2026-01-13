import React from 'react';
import type { SimulationSummary } from '../domain/Simulator';

interface ResultsViewProps {
    results: SimulationSummary | null;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ results }) => {
    if (!results) return null;

    const { totalBattles, winRates, winCounts, avgSurvivalRates, avgFleeRates, timeOutCount, lastBattleLog } = results;
    const teamIds = Object.keys(avgSurvivalRates).sort();

    const getPercent = (val: number) => (val * 100).toFixed(1) + '%';
    const getBarWidth = (val: number) => `${Math.max(val * 100, 1)}%`;

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3>シミュレーション結果 ({totalBattles} 回試行)</h3>
                    <div className="text-sm text-gray-400">
                        時間切れ: {timeOutCount} 回
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    {teamIds.map(tid => (
                        <div key={tid} className="bg-black/30 p-4 rounded-lg">
                            <h4 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">チーム {tid}</h4>

                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>勝率 (勝利数: {winCounts[tid] || 0})</span>
                                    <span className="text-accent">{getPercent(winRates[tid] || 0)}</span>
                                </div>
                                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-accent h-full" style={{ width: getBarWidth(winRates[tid] || 0) }}></div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>生存率</span>
                                    <span className="text-success">{getPercent(avgSurvivalRates[tid])}</span>
                                </div>
                                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-success h-full" style={{ width: getBarWidth(avgSurvivalRates[tid]) }}></div>
                                </div>
                            </div>

                            <div className="mb-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>敗走/逃走率</span>
                                    <span className="text-warning">{getPercent(avgFleeRates[tid])}</span>
                                </div>
                                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-warning h-full" style={{ width: getBarWidth(avgFleeRates[tid]) }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-panel p-6">
                <h3 className="mb-4">戦闘ログ（最終戦）</h3>
                <div className="bg-black/80 font-mono text-xs p-4 rounded h-64 overflow-y-auto text-left">
                    {lastBattleLog.map((log, i) => (
                        <div key={i} className={log === "" ? "h-4" : ""}>
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
