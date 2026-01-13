import React from 'react';
import { Team } from '../domain/Team';
import type { TeamId, TeamType } from '../domain/Team';
import { Member } from '../domain/Member';
import { MonsterPresets, createHumanoid } from '../domain/Presets';
import { MemberEditor } from './MemberEditor';

interface TeamConfigProps {
    teams: Team[];
    onUpdateTeams: (teams: Team[]) => void;
    enableKarma: boolean;
    onEnableKarma: (enable: boolean) => void;
    randomizeTeamA?: { enabled: boolean; count: number };
    onSetRandomizeTeamA?: (val: { enabled: boolean; count: number }) => void;
}

export const TeamConfig: React.FC<TeamConfigProps> = ({ teams, onUpdateTeams, enableKarma, onEnableKarma, randomizeTeamA, onSetRandomizeTeamA }) => {

    const addTeam = () => {
        const existingIds = teams.map(t => t.id);
        const candidates: TeamId[] = ['A', 'B', 'C', 'D'];
        const nextId = candidates.find(id => !existingIds.includes(id));

        if (!nextId) return;

        const type: TeamType = nextId === 'A' ? 'Player' : 'NPC';
        const newTeam = new Team(nextId, type, [], []);
        onUpdateTeams([...teams, newTeam]);
    };

    const removeTeam = (id: TeamId) => {
        onUpdateTeams(teams.filter(t => t.id !== id));
    };

    const removeMember = (teamId: TeamId, memberId: string) => {
        const updatedTeams = teams.map(t => {
            if (t.id !== teamId) return t;
            return new Team(t.id, t.type, t.members.filter(m => m.id !== memberId), t.enemyTeamIds);
        });
        onUpdateTeams(updatedTeams);
    };

    const addMember = (teamId: TeamId, presetName: string | 'PC Random') => {
        const updatedTeams = teams.map(t => {
            if (t.id !== teamId) return t;

            let member: Member;
            if (presetName === 'PC Random') {
                // Changing default name to '人間-{N}' as requested
                // Note: User asked for "人間-1", "人間-2" etc.
                const count = t.members.filter(m => m.type === 'Humanoid').length + 1;
                member = createHumanoid(`人間-${count}`);
            } else {
                const creator = MonsterPresets[presetName];
                if (creator) {
                    member = creator();
                    const escaped = presetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`^${escaped}(-\\d+)?$`);
                    let count = t.members.filter(m => regex.test(m.name)).length + 1;

                    while (t.members.some(m => m.name === `${presetName}-${count}`)) {
                        count++;
                    }

                    member.name = `${presetName}-${count}`;
                } else {
                    return t;
                }
            }

            return new Team(t.id, t.type, [...t.members, member], t.enemyTeamIds);
        });
        onUpdateTeams(updatedTeams);
    };

    const setEnemies = (teamId: TeamId, enemyString: string) => {
        const enemies = enemyString.split(',').map(s => s.trim().toUpperCase()) as TeamId[];
        const validEnemies = enemies.filter(e => ['A', 'B', 'C', 'D'].includes(e));

        const updatedTeams = teams.map(t => {
            if (t.id === teamId) {
                return new Team(t.id, t.type, t.members, validEnemies);
            }
            return t;
        });
        onUpdateTeams(updatedTeams);
    }

    const availablePresets = Object.keys(MonsterPresets);

    const getTeamTypeLabel = (type: TeamType) => type === 'Player' ? 'プレイヤー' : 'NPC';
    const getMemberTypeLabel = (type: string) => type === 'Humanoid' ? '人間' : (type === 'Monster' ? '魔物' : type);

    const [editingTeamId, setEditingTeamId] = React.useState<TeamId | null>(null);

    const handleReorganizeTeamA = () => {
        if (!randomizeTeamA || randomizeTeamA.count <= 0) return;

        const newMembers: Member[] = [];
        for (let i = 1; i <= randomizeTeamA.count; i++) {
            newMembers.push(createHumanoid(`人間-${i}`));
        }

        const updatedTeams = teams.map(t => {
            if (t.id === 'A') {
                return new Team(t.id, t.type, newMembers, t.enemyTeamIds);
            }
            return t;
        });
        onUpdateTeams(updatedTeams);
    };

    const handleAddCustom = (member: import('../domain/Member').Humanoid) => {
        if (!editingTeamId) return;
        const updatedTeams = teams.map(t => {
            if (t.id !== editingTeamId) return t;
            return new Team(t.id, t.type, [...t.members, member], t.enemyTeamIds);
        });
        onUpdateTeams(updatedTeams);
        setEditingTeamId(null);
    };

    return (
        <div className="flex flex-col gap-6">

            <div className="flex justify-between items-center">
                <h2>チーム設定</h2>
                <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={enableKarma}
                            onChange={(e) => onEnableKarma(e.target.checked)}
                            className="bg-gray-800 border-gray-600 rounded"
                        />
                        業システムを有効化
                    </label>
                    {teams.length < 4 && (
                        <button onClick={addTeam} className="text-accent">
                            + チーム追加
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map(team => (
                    <div key={team.id} className="glass-panel p-4">
                        <div className="flex justify-between mb-2">
                            <h3>チーム {team.id} ({getTeamTypeLabel(team.type)})</h3>
                            {team.id !== 'A' && (
                                <button onClick={() => removeTeam(team.id)} className="text-sm bg-red-900/50 border-red-500/50">削除</button>
                            )}
                        </div>

                        {team.id === 'A' && randomizeTeamA && onSetRandomizeTeamA && (
                            <div className="mb-4 p-2 bg-gray-900/50 rounded border border-gray-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={randomizeTeamA.enabled}
                                        onChange={(e) => onSetRandomizeTeamA({ ...randomizeTeamA, enabled: e.target.checked })}
                                        className="bg-gray-800 border-gray-600 rounded"
                                    />
                                    <label className="text-xs text-gray-400">試行ごとに毎回再編成する</label>
                                </div>

                                <label className="text-xs text-gray-400 block mb-1">再編成する人数</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={randomizeTeamA.count}
                                        onChange={(e) => onSetRandomizeTeamA({ ...randomizeTeamA, count: parseInt(e.target.value) || 0 })}
                                        className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-16 text-sm"
                                    />
                                    <button
                                        onClick={handleReorganizeTeamA}
                                        className="text-xs bg-accent/20 text-accent hover:bg-accent/40 border border-accent/50 px-2 rounded"
                                    >
                                        メンバーを生成・確認
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="text-sm mr-2">敵対チーム:</label>
                            <input
                                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full mt-1"
                                placeholder="例: B, C"
                                defaultValue={team.enemyTeamIds.join(', ')}
                                onBlur={(e) => setEnemies(team.id, e.target.value)}
                            />
                        </div>

                        <div className="mb-4">
                            <h4 className="text-sm text-gray-400 mb-2">メンバー ({team.members.length})</h4>
                            <div className="max-h-32 overflow-y-auto mb-2 text-xs space-y-1">
                                {team.members.map((m, idx) => (
                                    <div key={m.id} className="flex justify-between items-center bg-black/20 p-1 rounded">
                                        <span>{idx + 1}. {m.name} ({getMemberTypeLabel(m.type)})</span>
                                        <div className="flex gap-2">
                                            <span>HP: {m.maxHp}</span>
                                            <span>防具: {m.armorRoll || `LV${m.armorLevel}`}</span>
                                            <span className="text-gray-400 text-[10px] self-center">[{m.weapons.map(w => w.name).join(', ')}]</span>
                                            <button
                                                onClick={() => removeMember(team.id, m.id)}
                                                className="text-red-500 hover:text-red-300 font-bold px-1"
                                                title="メンバー削除"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                <button onClick={() => addMember(team.id, 'PC Random')} className="text-xs">
                                    + ランダム人間
                                </button>
                                <button onClick={() => setEditingTeamId(team.id)} className="text-xs bg-accent/20 text-accent hover:bg-accent/40">
                                    + カスタム
                                </button>
                                <select
                                    className="bg-gray-800 border border-gray-600 rounded text-xs p-1"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            addMember(team.id, e.target.value);
                                            e.target.value = "";
                                        }
                                    }}
                                >
                                    <option value="">+ 魔物プリセット</option>
                                    {availablePresets.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            {editingTeamId === team.id && (
                                <MemberEditor
                                    onSave={handleAddCustom}
                                    onCancel={() => setEditingTeamId(null)}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
