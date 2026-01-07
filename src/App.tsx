import { useState } from 'react';
import { TeamConfig } from './components/TeamConfig';
import { SimulationRunner } from './components/SimulationRunner';
import { ResultsView } from './components/ResultsView';
import { Team } from './domain/Team';
import { Simulator } from './domain/Simulator';
import type { SimulationSummary } from './domain/Simulator';
import { createHumanoid } from './domain/Presets';

function App() {
  const [teams, setTeams] = useState<Team[]>([
    new Team('A', 'Player', [createHumanoid('人間-1'), createHumanoid('人間-2')], ['B']),
    new Team('B', 'NPC', [], ['A'])
  ]);

  const [simulationResults, setSimulationResults] = useState<SimulationSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [enableKarma, setEnableKarma] = useState(false);

  const [randomizeTeamA, setRandomizeTeamA] = useState<{ enabled: boolean; count: number }>({ enabled: false, count: 6 });

  const handleRunSimulation = async (count: number) => {
    setIsRunning(true);
    setSimulationResults(null);

    try {
      const teamFactory = () => {
        return teams.map(t => {
          // If this is Team A and randomization is enabled, generate fresh members
          if (t.id === 'A' && randomizeTeamA.enabled) {
            const freshMembers = [];
            for (let i = 1; i <= randomizeTeamA.count; i++) {
              freshMembers.push(createHumanoid(`人間-${i}`));
            }
            const newTeamA = new Team(t.id, t.type, freshMembers, [...t.enemyTeamIds]);
            newTeamA.initialMemberCount = freshMembers.length;
            return newTeamA;
          }

          const clonedMembers = t.members.map(m => {
            const clone = Object.assign(Object.create(Object.getPrototypeOf(m)), m);
            clone.weapons = m.weapons.map(w => ({ ...w, isBroken: false })); // Clone weapons and reset broken state
            clone.statusEffects = [];
            clone.statModifiers = {}; // Reset stat modifiers
            clone.rollModifiers = 0;
            clone.turnCount = 0;
            clone.hp = clone.maxHp;
            clone.armorLevel = m.armorLevel;
            return clone;
          });

          const newTeam = new Team(t.id, t.type, clonedMembers, [...t.enemyTeamIds]);
          newTeam.initialMemberCount = clonedMembers.length;
          return newTeam;
        });
      };

      const sim = new Simulator([]);
      const result = await sim.run(count, teamFactory, enableKarma);
      setSimulationResults(result);

    } catch (e) {
      console.error(e);
      alert("Simulation failed. Check console.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="mb-8">
        <h1>信長の黒い城戦闘シミュレータ</h1>
        <p className="text-sm text-gray-400">v1.0.0</p>
      </header>

      <main className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
        <TeamConfig
          teams={teams}
          onUpdateTeams={setTeams}
          enableKarma={enableKarma}
          onEnableKarma={setEnableKarma}
          randomizeTeamA={randomizeTeamA}
          onSetRandomizeTeamA={setRandomizeTeamA}
        />

        <SimulationRunner onRun={handleRunSimulation} isRunning={isRunning} />

        <ResultsView results={simulationResults} />
      </main>
    </div>
  );
}

export default App;
