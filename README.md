# CRYING DOOM — Chapter One: The House That Cries

*"Some cries are warnings. Others are invitations."*

A first-person 3D supernatural mystery-horror game built with **React**, **TypeScript**, **Three.js**, and **Tailwind CSS**, featuring procedural PBR textures, dynamic lighting, spatialized Web Audio synthesis, connected multi-storey exploration, and environmental puzzle solving.

---

## Controls

| Action | Desktop | Mobile |
|---|---|---|
| Move | `W` `A` `S` `D` / Arrow Keys | Left Virtual Joystick |
| Walk Faster | `Left Shift` | — |
| Look Around | Mouse (Click viewport for Pointer Lock) | Right Touch Area |
| Interact / Examine | `E` | Contextual Action Button |
| Toggle Flashlight | `F` | Flashlight Button |
| Inventory & Evidence Journal | `I` | Journal Button |
| Pause Menu | `ESC` | Pause Button |

---

## Architecture Overview

- `src/data/` — Story data definitions (`items.ts`, `clues.ts`, `objectives.ts`, `dialogue.ts`).
- `src/game/` — Core 3D simulation & systems:
  - `GameEngine.ts`: WebGLRenderer loop (with software-WebGL guard & `RoomEnvironment`), scripted horror events, progression, and autosave.
  - `HouseWorld.ts`: Physically connected 3D house (Exterior, Porch, Living Room, Hallway, Upstairs Staircase & Landing, Bedroom, Basement Staircase, Basement, Hidden Compartment) with non-overlapping floor/ceiling/stair geometry and AABB colliders.
  - `PlayerController.ts`: First-person movement, stair elevation solver, sliding collision, head-bobbing (respecting comfort settings), flashlight spotlight, and interaction raycasting.
  - `Textures.ts`: Procedural 2D Canvas PBR textures (`SRGBColorSpace` + anisotropy).
  - `AudioManager.ts`: Procedural Web Audio API synthesizer for ambience, horror events, interactions, and sparse piano music.
  - `SaveManager.ts`: Persistent `localStorage` save state and settings management.
- `src/components/` — Minimal horror UI (`MainMenu`, `ContentWarningModal`, `HUD`, `DiaryModal`, `PhotographModal`, `BasementPuzzleModal`, `InventoryModal`, `MenuModals`, `EndingScreen`).

---

## Chapter One Progression Flow

1. **Approach & Entry**: Follow the crying up the gravel path and enter the front door.
2. **Living Room**: Examine the stopped **Wall Clock (10:15)** and read all entries in the **Old Diary** on the coffee table.
3. **Upstairs Bedroom**: Follow the crying upstairs, inspect and flip over the **Old Family Photograph** to reveal the hidden message and **Tri-Moon Crescent** sigil.
4. **Basement Access**: Search the ground-floor hallway console table for the **Basement Key** and unlock the basement door.
5. **Basement Mystery**: Play the **Old Recording Device**, then align the **Basement Wall Mechanism** (`10:15`, Tri-Moon sigil, and **3 knocks** on the wooden panel) to open the hidden compartment and trigger the final sequence.
