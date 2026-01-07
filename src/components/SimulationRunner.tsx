import React, { useState } from 'react';

interface SimulationRunnerProps {
    onRun: (count: number) => void;
    isRunning: boolean;
}

export const SimulationRunner: React.FC<SimulationRunnerProps> = ({ onRun, isRunning }) => {
    const [count, setCount] = useState(1);

    return (
        <div className="glass-panel p-6 flex flex-col items-center gap-4">
            <h2>シミュレーション操作</h2>

            <div className="flex items-center gap-4">
                <label>試行回数:</label>
                <input
                    type="number"
                    value={count}
                    min={1}
                    max={10000}
                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-24 text-center"
                />
            </div>

            <button
                onClick={() => onRun(count)}
                disabled={isRunning}
                className={`w-48 py-3 text-lg font-bold ${isRunning ? 'opacity-50 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover'}`}
            >
                {isRunning ? '実行中...' : 'シミュレーション実行'}
            </button>
        </div>
    );
};
