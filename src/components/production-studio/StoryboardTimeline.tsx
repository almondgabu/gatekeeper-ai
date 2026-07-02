"use client";

import { useEffect, useState } from "react";
import SceneCard from "./SceneCard";
import { Film, MoveHorizontal, PlusCircle } from "lucide-react";
import { StoryboardSceneDraft } from "@/types/production-studio";

type StoryboardTimelineProps = {
  scenes: StoryboardSceneDraft[];
  onChange: (nextScenes: StoryboardSceneDraft[]) => void;
};

export default function StoryboardTimeline({ scenes, onChange }: StoryboardTimelineProps) {
  const [collapsedScenes, setCollapsedScenes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCollapsedScenes((current) => {
      const next: Record<string, boolean> = {};

      scenes.forEach((scene, index) => {
        next[scene.id] = current[scene.id] ?? (index === 0 ? false : false);
      });

      return next;
    });
  }, [scenes]);

  function normalizeSceneNumbers(nextScenes: StoryboardSceneDraft[]) {
    return nextScenes.map((scene, index) => ({
      ...scene,
      sceneNumber: index + 1,
    }));
  }

  function addScene() {
    const nextIndex = scenes.length + 1;
    const template = scenes[scenes.length - 1];

    const nextScene: StoryboardSceneDraft = {
      id: crypto.randomUUID(),
      sceneNumber: nextIndex,
      title: `Scene ${nextIndex}`,
      purpose: template?.purpose ?? "Continue narrative",
      estimatedDuration: template?.estimatedDuration ?? "8 sec",
      imagePrompt: template?.imagePrompt ?? "",
      videoPrompt: template?.videoPrompt ?? "",
      voiceover: "",
      directorNotes: "",
      status: "Planning",
    };

    onChange([...scenes, nextScene]);
  }

  function updateScene(sceneId: string, nextScene: StoryboardSceneDraft) {
    onChange(scenes.map((scene) => (scene.id === sceneId ? nextScene : scene)));
  }

  function duplicateScene(sceneId: string) {
    const index = scenes.findIndex((scene) => scene.id === sceneId);
    if (index < 0) {
      return;
    }

    const source = scenes[index];
    const nextScenes = [...scenes];
    nextScenes.splice(index + 1, 0, {
      ...source,
      id: crypto.randomUUID(),
      title: `${source.title} Copy`,
    });

    onChange(normalizeSceneNumbers(nextScenes));
  }

  function moveScene(sceneId: string, direction: -1 | 1) {
    const index = scenes.findIndex((scene) => scene.id === sceneId);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= scenes.length) {
      return;
    }

    const nextScenes = [...scenes];
    const [moved] = nextScenes.splice(index, 1);
    nextScenes.splice(targetIndex, 0, moved);

    onChange(normalizeSceneNumbers(nextScenes));
  }

  function deleteScene(sceneId: string) {
    if (scenes.length <= 1) {
      return;
    }

    onChange(normalizeSceneNumbers(scenes.filter((scene) => scene.id !== sceneId)));
  }

  function toggleScene(sceneId: string) {
    setCollapsedScenes((current) => ({
      ...current,
      [sceneId]: !current[sceneId],
    }));
  }

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-[0_20px_55px_rgba(2,6,23,0.3)] md:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-2 text-cyan-200">
            <Film size={16} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white md:text-lg">Storyboard Timeline</h2>
            <p className="mt-1 text-xs leading-6 text-slate-400">Hero strip for scene pacing, narration flow, and production prompts.</p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-slate-400 md:inline-flex"><MoveHorizontal size={13} /> Scroll horizontally</span>
      </div>

      <div className="mt-5 overflow-x-hidden rounded-xl border border-slate-800/80 bg-slate-950/45 p-3 pb-4 md:overflow-x-auto md:p-4 md:pb-5">
        <div className="flex flex-col gap-4 md:min-w-max md:flex-row md:gap-6">
          {scenes.map((scene, index) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              canMoveUp={index > 0}
              canMoveDown={index < scenes.length - 1}
              isCollapsed={Boolean(collapsedScenes[scene.id])}
              onChange={(nextScene) => updateScene(scene.id, nextScene)}
              onToggleCollapse={() => toggleScene(scene.id)}
              onDuplicate={() => duplicateScene(scene.id)}
              onMoveUp={() => moveScene(scene.id, -1)}
              onMoveDown={() => moveScene(scene.id, 1)}
              onDelete={() => deleteScene(scene.id)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addScene}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-3.5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-slate-900/45 hover:text-white"
        >
          <PlusCircle size={14} />
          Add New Scene
        </button>
      </div>
    </section>
  );
}
