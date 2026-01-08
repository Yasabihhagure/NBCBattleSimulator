import { Monster, Humanoid } from './Member';
import type { MemberStats } from './Member';
import { WeaponFactory } from './Weapon';
import { Dice } from './Dice';

export const W = (name: string, type: string, damage: string, hit?: string, targetHit?: string, ammo: string = '-1', special?: string, count: string = "1") =>
    WeaponFactory.create(name, type, hit, targetHit, damage, ammo, special, count);

export const MonsterPresets: Record<string, () => Monster> = {
    "足軽ファランクス": () => {
        const m = new Monster(crypto.randomUUID(), "足軽ファランクス", "2D6+8", 2, "LV2", "-D2");
        m.morale = m.maxHp;
        m.weapons = [
            { ...W("足軽ファランクスの乱撃", "近接武器", "1D8", undefined, "技DR12", undefined, undefined, "2"), usageType: 'Sequential', seqIndex: 1, name: "足軽ファランクスの乱撃" },
            { ...W("足軽ファランクスの乱撃と回復", "近接武器", "1D8", undefined, "技DR12", undefined, "回復", "1"), usageType: 'Sequential', seqIndex: 2, name: "足軽ファランクスの乱撃と回復" },
        ];
        return m;
    },
    // Updated Ashigaru above. Rest below updated with Counts if applicable.
    "百足衆": () => {
        const m = new Monster(crypto.randomUUID(), "百足衆", "12", 2, "LV2", null);
        m.morale = 8;
        m.weapons = [
            { ...W("百足衆の奇襲", "射撃武器", "2D6", "心DR12", "技DR15", undefined, undefined, "2"), usageType: 'FirstTurn', name: "百足衆の奇襲" },
            { ...W("百姓から奪った鍬", "近接武器", "1D4", "体DR12", "技DR12", undefined, undefined, "2"), usageType: 'Sequential', seqIndex: 1, name: "百姓から奪った鍬" },
            { ...W("百足衆の乱射", "射撃武器", "2D6", "心DR12", "技DR12", undefined, undefined, "2"), usageType: 'Sequential', seqIndex: 2, name: "百足衆の乱射" }
        ];
        return m;
    },
    "ろくろ首": () => {
        // Spec v4: ろくろ首 -> 1回
        const m = new Monster(crypto.randomUUID(), "ろくろ首", "8", 1, "LV1", null);
        m.morale = 4;
        m.weapons = [
            { ...W("妖艶", "射撃武器", "1", undefined, "技DR12", undefined, "妖艶状態", "1"), usageType: 'Sequential', seqIndex: 1, name: "妖艶" },
            { ...W("飛頭変", "射撃武器", "1D6", undefined, "技DR16", undefined, undefined, "1"), usageType: 'Sequential', seqIndex: 2, name: "飛頭変" }
        ];
        return m;
    },
    "河童水軍": () => {
        const m = new Monster(crypto.randomUUID(), "河童水軍", "10", 4, "LV4", null);
        m.morale = 9;
        m.weapons = [
            { ...W("相撲", "近接武器", "1D6", undefined, "体DR15", undefined, "尻子玉", "1"), usageType: 'Sequential', seqIndex: 1, name: "相撲" }
        ];
        return m;
    },
    "鬼": () => {
        const m = new Monster(crypto.randomUUID(), "鬼", "30", 0, "-1D6", null);
        m.morale = 99;
        m.weapons = [
            { ...W("金棒", "近接武器", "1D10", undefined, "技DR12", undefined, "吠える声", "1"), usageType: 'Sequential', seqIndex: 1, name: "金棒" }
        ];
        return m;
    },
    "黒母衣戦象": () => {
        const m = new Monster(crypto.randomUUID(), "黒母衣戦象", "50", 4, "LV4", null);
        m.morale = 10;
        m.weapons = [
            { ...W("戦象の鼻", "近接武器", "1D8", undefined, "技DR12", undefined, undefined, "1"), usageType: 'Sequential', seqIndex: 1, name: "戦象の鼻" },
            { ...W("戦象の足", "近接武器", "1D12", undefined, "技DR10", undefined, undefined, "1"), usageType: 'Sequential', seqIndex: 2, name: "戦象の足" },
            { ...W("戦象の呪い", "近接武器", "1D3", undefined, "耐久DR12", undefined, "麻痺１ターン", "1"), usageType: 'Sequential', seqIndex: 3, name: "戦象の呪い" },
            { ...W("戦象の死人踊り", "近接武器", "0", undefined, "常に", undefined, "足軽ファランクス召喚", "1"), usageType: 'Sequential', seqIndex: 4, name: "戦象の死人踊り" }
        ];
        return m;
    },
    "黒茶頭": () => {
        const m = new Monster(crypto.randomUUID(), "黒茶頭", "18", 4, "LV4", null);
        m.morale = 10;
        m.weapons = [
            { ...W("黒茶頭の茶", "近接武器", "0", undefined, "心DR15", undefined, "宇宙の深淵", "1"), usageType: 'Sequential', seqIndex: 1, name: "黒茶頭の茶" }
        ];
        return m;
    },
    "赤母衣髑髏": () => {
        const m = new Monster(crypto.randomUUID(), "赤母衣髑髏", "12", 4, "LV4", null);
        m.morale = 12;
        m.weapons = [
            W("突撃", "近接武器", "1D10", "心DR14", "技DR14", "-1", undefined, "1"),
            W("大槍", "近接武器", "1D8", "体DR12", "技DR12", "-1", undefined, "1")
        ];
        // Charge is Attack 0 (FirstTurn), Great Spear is Attack 1 (Sequential default)
        m.weapons[0].usageType = 'FirstTurn';
        m.weapons[1].usageType = 'Sequential';
        m.weapons[1].seqIndex = 1;
        return m;
    },
    "亡霊武者": () => {
        const m = new Monster(crypto.randomUUID(), "亡霊武者", "5", 0, "なし", null);
        m.morale = 99;
        m.weapons = [
            { ...W("亡霊武者の攻撃", "近接武器", "1D6", undefined, "技DR12", "-1", "麻痺の吐息", "1"), usageType: 'Sequential', seqIndex: 1, name: "亡霊武者の攻撃" }
        ];
        return m;
    },
    "禿ネズミ武将": () => {
        const m = new Monster(crypto.randomUUID(), "禿ネズミ武将", "25", 4, "LV4", null);
        m.morale = 10;
        m.weapons = [
            { ...W("姑息な奇襲", "近接武器", "1D8", undefined, "心DR15", "-1", "禿ネズミの感染", "1"), usageType: 'Sequential', seqIndex: 1, name: "姑息な奇襲" }
        ];
        return m;
    },
    "第六天魔王信長": () => {
        const m = new Monster(crypto.randomUUID(), "第六天魔王信長", "108", 0, "-1D10", null);
        m.morale = 99;
        m.weapons = [
            { ...W("へし切り長谷部", "近接武器", "1D12+1", undefined, "技DR15", "-1", "信長の攻撃", "1"), usageType: 'Sequential', seqIndex: 1, name: "へし切り長谷部" }
        ];
        return m;
    },
    "山犬雑兵": () => {
        const m = new Monster(crypto.randomUUID(), "山犬雑兵", "4", 2, "LV2", null);
        m.morale = 7;
        m.weapons = [
            { ...W("山犬雑兵の攻撃", "近接武器", "1D4", undefined, "技DR12", "-1", "槍からの感染", "1"), usageType: 'Sequential', seqIndex: 1, name: "山犬雑兵の攻撃" }
        ];
        return m;
    },
    "鎌鼬": () => {
        const m = new Monster(crypto.randomUUID(), "鎌鼬", "4", 0, "-D3", null);
        m.morale = 8;
        m.weapons = [
            { ...W("鎌鼬の鎌", "近接武器", "1D4", undefined, "技DR12", undefined, undefined, "2"), usageType: 'Sequential', seqIndex: 1, name: "鎌鼬の鎌" },
            // Spec v4 says: [攻撃1]:2回 "鎌鼬の鎌". So single entry with count 2.
            // Previous version had 2 separate entries for sequential...
            // If Battle logic loops count, we only need 1 entry per sequence phase.
        ];
        return m;
    },
    "生臭坊主": () => {
        const m = new Monster(crypto.randomUUID(), "生臭坊主", "3", 0, "なし", null);
        m.morale = 99;
        m.weapons = [
            { ...W("暗黒呪い", "近接武器", "0", undefined, "心DR16", undefined, "被命中判定不足分ダメージ", "1"), usageType: 'Sequential', seqIndex: 1, name: "暗黒呪い" },
            { ...W("鉤爪", "近接武器", "1D3", undefined, "技DR12", undefined, undefined, "2"), usageType: 'Sequential', seqIndex: 2, name: "鉤爪" },
        ];
        return m;
    },
    "槍かつぎのやせがえる": () => {
        const m = new Monster(crypto.randomUUID(), "槍かつぎのやせがえる", "7", 2, "LV2", null);
        m.morale = 7;
        m.weapons = [
            { ...W("槍", "近接武器", "1D6", undefined, "技DR12", undefined, undefined, "1"), usageType: 'Sequential', seqIndex: 1, name: "槍" },
            { ...W("蛙の蹴り", "近接武器", "1D3", undefined, "技DR12", undefined, "蹴りによる効果", "2"), usageType: 'Sequential', seqIndex: 2, name: "蛙の蹴り" },
        ];
        return m;
    },
    "足軽兎": () => {
        const m = new Monster(crypto.randomUUID(), "足軽兎", "3", 2, "LV2", null);
        m.morale = 99; // Helper logic needed
        m.weapons = [
            { ...W("刀", "近接武器", "1D6", "体DR12", "技DR12", undefined, undefined, "1"), usageType: 'Sequential', seqIndex: 1, name: "刀" }
        ];
        return m;
    },
    "のっぺら荒武者": () => {
        const m = new Monster(crypto.randomUUID(), "のっぺら荒武者", "12", 3, "LV3", null);
        m.morale = 11;
        m.weapons = [
            { ...W("大槍", "近接武器", "1D8", undefined, "技DR12", undefined, undefined, "1"), usageType: 'Sequential', seqIndex: 1, name: "大槍" },
            { ...W("赤い舌", "近接武器", "1D4", undefined, "技DR12", undefined, "舐めて回復", "1"), usageType: 'Sequential', seqIndex: 2, name: "赤い舌" }
        ];
        return m;
    },
    "鉄砲猩々": () => {
        const m = new Monster(crypto.randomUUID(), "鉄砲猩々", "10", 2, "LV2", null);
        m.morale = 9;
        m.weapons = [
            { ...W("大ざるの種子島銃", "射撃武器", "2D6", "心DR12", "技DR12", "5", undefined, "1"), usageType: 'Sequential', seqIndex: 1, name: "大ざるの種子島銃" },
            { ...W("馬の大腿骨", "近接武器", "1D4", "体DR12", "技DR12", undefined, undefined, "1"), usageType: 'Reserve', name: "馬の大腿骨" }
        ];
        m.targetStrategy = 'HighHP';
        return m;
    },
    "鉄騎猪": () => {
        const m = new Monster(crypto.randomUUID(), "鉄騎猪", "10", 4, "LV4", null);
        m.morale = 7;
        m.weapons = [
            { ...W("猪の突進", "近接武器", "1D6", undefined, undefined, undefined, undefined, "1"), usageType: 'Sequential', seqIndex: 1, name: "猪の突進" }
        ];
        return m;
    },
    "くのいち狐": () => {
        const m = new Monster(crypto.randomUUID(), "くのいち狐", "10", 0, "-1D3", null);
        m.morale = 7;
        m.weapons = [
            { ...W("狐の誘惑", "射撃武器", "0", undefined, "心DR14", undefined, "装備外し", "1"), usageType: 'Sequential', seqIndex: 1, name: "狐の誘惑" },
            { ...W("狐の牙", "近接武器", "1D4", undefined, "技DR12", undefined, undefined, "1"), usageType: 'Sequential', seqIndex: 2, name: "狐の牙" }
        ];
        return m;
    },
    "弾正狸": () => {
        const m = new Monster(crypto.randomUUID(), "弾正狸", "12", 3, "LV3", null);
        m.morale = 10;
        m.weapons = [
            { ...W("茶釜爆弾", "射撃武器", "1D6", undefined, "技DR12", undefined, undefined, "1D4"), usageType: 'Sequential', seqIndex: 1, name: "茶釜爆弾" },
            { ...W("表裏の舞", "近接武器", "0", undefined, undefined, undefined, "舞につられる", "1"), usageType: 'Sequential', seqIndex: 2, name: "表裏の舞" },
            { ...W("平蜘蛛", "射撃武器", "1D6", undefined, "技DR12", undefined, undefined, "1D6"), usageType: 'Sequential', seqIndex: 3, name: "平蜘蛛" },
            { ...W("狸の自爆", "範囲武器", "1D10", undefined, "技DR12", undefined, undefined, "1"), usageType: 'OnDeath', name: "狸の自爆" }
        ];
        return m;
    },
    "からくり巴": () => {
        const m = new Monster(crypto.randomUUID(), "からくり巴", "15", 3, "LV3", null);
        m.morale = 12;
        m.weapons = [
            { ...W("斬馬刀", "近接武器", "1D10", "体DR12", "技DR12", undefined, undefined, "1"), usageType: 'Sequential', seqIndex: 1, name: "斬馬刀" },
            { ...W("刀", "近接武器", "1D6", "体DR12", "技DR12", undefined, undefined, "1"), usageType: 'Sequential', seqIndex: 2, name: "刀" },
            { ...W("からくり巴の手裏剣", "射撃武器", "1D4", "心DR12", "技DR12", undefined, undefined, "2"), usageType: 'Sequential', seqIndex: 3, name: "からくり巴の手裏剣" }
        ];
        return m;
    },
    "烏天狗": () => {
        const m = new Monster(crypto.randomUUID(), "烏天狗", "8", 0, "-1D3", null);
        m.morale = 9;
        m.weapons = [
            { ...W("弓矢", "射撃武器", "1D6", "心DR12", "技DR12", undefined, undefined, "1"), usageType: 'Sequential', seqIndex: 1, name: "弓矢" },
            { ...W("義経流霞の太刀", "近接武器", "1D8", "体DR12", "技DR12", undefined, undefined, "1"), usageType: 'Sequential', seqIndex: 2, name: "義経流霞の太刀" }
        ];
        return m;
    },
};

export const createHumanoid = (name: string): Humanoid => {
    // ... Same as before
    const rollStat = () => {
        const r = Dice.roll(3, 6);
        if (r <= 4) return -3;
        if (r <= 6) return -2;
        if (r <= 8) return -1;
        if (r <= 12) return 0;
        if (r <= 14) return 1;
        if (r <= 16) return 2;
        return 3;
    };

    const stats: MemberStats = {
        heart: rollStat(),
        skill: rollStat(),
        body: rollStat(),
        durability: rollStat()
    };

    const h = new Humanoid(crypto.randomUUID(), name, stats);

    // 1D12 Weapon Table
    // 1: 尖らせた骨の杭 (Melee, Body DR12, Skill DR12, 1D3)
    // 2: 竹槍 (Melee, Body DR12, Skill DR12, 1D4)
    // 3: 百姓から奪った鍬 (Melee, Body DR12, Skill DR12, 1D4)
    // 4: 脇差し (Melee, Body DR12, Skill DR12, 1D4)
    // 5: 手裏剣 (Ranged, Heart DR12, Skill DR12, 1D4, Ammo: 1D6)
    // 6: 刀 (Melee, Body DR12, Skill DR12, 1D6)
    // 7: 鎖鎌 (Melee, Body DR12, Skill DR12, 1D6)
    // 8: 太刀 (Melee, Body DR12, Skill DR12, 1D8)
    // 9: 種子島銃 (Ranged, Heart DR12, Skill DR12, 2D6, Ammo: Heart+5)
    // 10: 大槍 (Melee, Body DR12, Skill DR12, 1D8)
    // 11: 爆裂弾 (Ranged, Heart DR12, Skill DR12, 1D4, Ammo: Heart+3)
    // 12: 斬馬刀 (Melee, Body DR12, Skill DR12, 1D10)

    const wRoll = Dice.roll(1, 12);
    const weaponDef = PlayerWeapons.find(pw => pw.id === wRoll) || PlayerWeapons[5]; // Default to Katana (id 6) -> index 5? No, find by ID.

    let weapon = W(weaponDef.name, weaponDef.type, weaponDef.damage, weaponDef.hit, weaponDef.targetHit, weaponDef.ammo);
    // Special handling for dynamic ammo in random creation
    if (weaponDef.ammo === 'Heart+5') {
        weapon = W(weaponDef.name, weaponDef.type, weaponDef.damage, weaponDef.hit, weaponDef.targetHit, `${stats.heart + 5}`);
    } else if (weaponDef.ammo === 'Heart+3') {
        weapon = W(weaponDef.name, weaponDef.type, weaponDef.damage, weaponDef.hit, weaponDef.targetHit, `${stats.heart + 3}`);
    }

    h.weapons = [weapon];

    const armorRoll = Dice.roll(1, 6);
    const armorMap = [0, 0, 0, 1, 2, 3, 4];
    h.armorLevel = armorMap[armorRoll];

    return h;
};

export const PlayerWeapons = [
    { id: 1, name: "尖らせた骨の杭", type: "近接武器", damage: "1D3", hit: "体DR12", targetHit: "技DR12" },
    { id: 2, name: "竹槍", type: "近接武器", damage: "1D4", hit: "体DR12", targetHit: "技DR12" },
    { id: 3, name: "百姓から奪った鍬", type: "近接武器", damage: "1D4", hit: "体DR12", targetHit: "技DR12" },
    { id: 4, name: "脇差し", type: "近接武器", damage: "1D4", hit: "体DR12", targetHit: "技DR12" },
    { id: 5, name: "手裏剣", type: "射撃武器", damage: "1D4", hit: "心DR12", targetHit: "技DR12", ammo: "1D6" },
    { id: 6, name: "刀", type: "近接武器", damage: "1D6", hit: "体DR12", targetHit: "技DR12" },
    { id: 7, name: "鎖鎌", type: "近接武器", damage: "1D6", hit: "体DR12", targetHit: "技DR12" },
    { id: 8, name: "太刀", type: "近接武器", damage: "1D8", hit: "体DR12", targetHit: "技DR12" },
    { id: 9, name: "種子島銃", type: "射撃武器", damage: "2D6", hit: "心DR12", targetHit: "技DR12", ammo: "Heart+5" },
    { id: 10, name: "大槍", type: "近接武器", damage: "1D8", hit: "体DR12", targetHit: "技DR12" },
    { id: 11, name: "爆裂弾", type: "射撃武器", damage: "1D4", hit: "心DR12", targetHit: "技DR12", ammo: "Heart+3" },
    { id: 12, name: "斬馬刀", type: "近接武器", damage: "1D10", hit: "体DR12", targetHit: "技DR12" },
    { id: 13, name: "弓矢", type: "射撃武器", damage: "1D6", hit: "心DR12", targetHit: "技DR12", ammo: "Heart+4" },
];
