import React, { useState } from 'react';
import { Humanoid } from '../domain/Member';
import type { MemberStats } from '../domain/Member';
import { PlayerWeapons, W } from '../domain/Presets';

interface MemberEditorProps {
    onSave: (member: Humanoid) => void;
    onCancel: () => void;
}

export const MemberEditor: React.FC<MemberEditorProps> = ({ onSave, onCancel }) => {
    const [name, setName] = useState("人間-Custom");
    const [stats, setStats] = useState<MemberStats>({
        heart: 0,
        skill: 0,
        body: 0,
        durability: 0
    });
    const [armorLevel, setArmorLevel] = useState(0);
    const [weaponId, setWeaponId] = useState(6); // Default: Katana (ID 6)

    const [hp, setHp] = useState(8);
    const [karma, setKarma] = useState(2);

    const handleChangeStat = (key: keyof MemberStats, val: number) => {
        setStats(prev => ({ ...prev, [key]: val }));
    };

    const handleSave = () => {
        const h = new Humanoid(crypto.randomUUID(), name, stats);
        h.armorLevel = armorLevel;
        h.maxHp = hp;
        h.hp = hp;
        h.karma = karma;

        const weaponDef = PlayerWeapons.find(pw => pw.id === weaponId);
        if (weaponDef) {
            let ammo = weaponDef.ammo;
            if (ammo === 'Heart+5') ammo = `${stats.heart + 5}`;
            if (ammo === 'Heart+3') ammo = `${stats.heart + 3}`;

            const weapon = W(weaponDef.name, weaponDef.type, weaponDef.damage, weaponDef.hit, weaponDef.targetHit, ammo);
            h.weapons = [weapon];
        }

        onSave(h);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="glass-panel p-6 w-96 relative">
                <button
                    onClick={onCancel}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                    ×
                </button>
                <h3 className="mb-4 text-xl font-bold">メンバー作成</h3>

                <div className="mb-4 flex gap-4">
                    <div className="flex-grow">
                        <label className="block text-xs mb-1">名前</label>
                        <input
                            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div className="w-20">
                        <label className="block text-xs mb-1">HP</label>
                        <input
                            type="number"
                            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full"
                            value={hp}
                            onChange={e => setHp(parseInt(e.target.value) || 1)}
                        />
                    </div>
                    <div className="w-20">
                        <label className="block text-xs mb-1">業</label>
                        <input
                            type="number"
                            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full"
                            value={karma}
                            onChange={e => setKarma(parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    {(['heart', 'skill', 'body', 'durability'] as const).map(statKey => (
                        <div key={statKey}>
                            <label className="block text-xs mb-1 capitalize">{
                                statKey === 'heart' ? '心' :
                                    statKey === 'skill' ? '技' :
                                        statKey === 'body' ? '体' : '耐久'
                            }</label>
                            <input
                                type="number"
                                className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full"
                                value={stats[statKey]}
                                onChange={e => handleChangeStat(statKey, parseInt(e.target.value) || 0)}
                            />
                        </div>
                    ))}
                </div>

                <div className="mb-4">
                    <label className="block text-xs mb-1">鎧レベル (0-4)</label>
                    <input
                        type="number"
                        min={0}
                        max={4}
                        className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full"
                        value={armorLevel}
                        onChange={e => setArmorLevel(Math.min(4, Math.max(0, parseInt(e.target.value) || 0)))}
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-xs mb-1">武器</label>
                    <select
                        className="bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full text-sm"
                        value={weaponId}
                        onChange={e => setWeaponId(parseInt(e.target.value))}
                    >
                        {PlayerWeapons.map(pw => (
                            <option key={pw.id} value={pw.id}>
                                {pw.name} ({pw.damage})
                            </option>
                        ))}
                    </select>
                    {PlayerWeapons.find(pw => pw.id === weaponId)?.type === '射撃武器' && (
                        <p className="text-[10px] text-gray-400 mt-1">
                            ※弾薬数は心などに基づいて自動設定されます
                        </p>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600">
                        キャンセル
                    </button>
                    <button onClick={handleSave} className="px-3 py-1 text-sm bg-accent rounded text-black font-bold hover:opacity-80">
                        追加
                    </button>
                </div>
            </div>
        </div>
    );
};
