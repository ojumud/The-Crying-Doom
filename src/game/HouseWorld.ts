import * as THREE from 'three';
import { ProceduralTexturePack } from './Textures';

export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  id?: string;
}

export interface InteractiveObject {
  id: string;
  prompt: string;
  room: string;
  mesh: THREE.Object3D;
  worldPos: THREE.Vector3;
  maxDistance: number;
  enabled: boolean;
}

export class HouseWorld {
  public readonly group = new THREE.Group();
  public readonly colliders: BoxCollider[] = [];
  public readonly interactives: InteractiveObject[] = [];
  public readonly raycastTargets: THREE.Object3D[] = [];

  private textures: ProceduralTexturePack;
  private isSoftwareGl: boolean;
  public reducedEffects = false;

  // Dynamic elements
  public frontDoorPivot!: THREE.Group;
  public frontDoorCollider!: BoxCollider;
  public basementDoorPivot!: THREE.Group;
  public basementDoorCollider!: BoxCollider;
  public hiddenPanelMesh!: THREE.Mesh;
  public hiddenPanelCollider!: BoxCollider;

  public diaryMesh!: THREE.Group;
  public photoMesh!: THREE.Group;
  public basementKeyMesh!: THREE.Group;
  public recordingReels: THREE.Mesh[] = [];
  public shiftChairGroup!: THREE.Group;
  public mirrorGhostMesh!: THREE.Group;
  public entitySilhouette!: THREE.Group;
  public curtains: THREE.Mesh[] = [];
  public waterDripParticles: { mesh: THREE.Mesh; y: number; speed: number }[] = [];
  public dustParticles!: THREE.Points;

  // Lights
  public livingLampLight!: THREE.PointLight;
  public upstairsSconceLight!: THREE.PointLight;
  public basementBulbLight!: THREE.PointLight;
  public exteriorWindowMat!: THREE.MeshStandardMaterial;
  public crtMat!: THREE.MeshStandardMaterial;
  public moonLight!: THREE.DirectionalLight;

  // Animation states
  public frontDoorAngle = 0;
  public frontDoorTargetAngle = 0;
  public basementDoorAngle = 0;
  public basementDoorTargetAngle = 0;
  public hiddenPanelOffset = 0;
  public hiddenPanelTargetOffset = 0;
  public recordingSpinning = false;
  public flickerIntensity = 0;

  // Shared materials to dispose cleanly
  private materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];

  constructor(textures: ProceduralTexturePack, isSoftwareGl: boolean) {
    this.textures = textures;
    this.isSoftwareGl = isSoftwareGl;
    this.buildWorld();
  }

  private trackMat<T extends THREE.Material>(m: T): T {
    this.materials.push(m);
    return m;
  }

  private trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  private addCollider(
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    minZ: number,
    maxZ: number,
    id?: string
  ): BoxCollider {
    const c: BoxCollider = { minX, maxX, minY, maxY, minZ, maxZ, id };
    this.colliders.push(c);
    return c;
  }

  private addInteractive(
    id: string,
    prompt: string,
    room: string,
    mesh: THREE.Object3D,
    hitPos: THREE.Vector3,
    hitSize: [number, number, number],
    maxDistance = 2.6
  ): InteractiveObject {
    const hitGeo = this.trackGeo(new THREE.BoxGeometry(hitSize[0], hitSize[1], hitSize[2]));
    const hitMat = this.trackMat(new THREE.MeshBasicMaterial({ visible: false }));
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.position.copy(hitPos);
    hitMesh.layers.set(1);
    hitMesh.userData.interactiveId = id;
    this.group.add(hitMesh);
    this.raycastTargets.push(hitMesh);

    const obj: InteractiveObject = {
      id,
      prompt,
      room,
      mesh,
      worldPos: hitPos.clone(),
      maxDistance,
      enabled: true,
    };
    this.interactives.push(obj);
    return obj;
  }

  private makeBox(
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    castShadow = false,
    receiveShadow = true
  ): THREE.Mesh {
    const geo = this.trackGeo(new THREE.BoxGeometry(w, h, d));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = !this.isSoftwareGl && castShadow;
    mesh.receiveShadow = !this.isSoftwareGl && receiveShadow;
    return mesh;
  }

  private buildWorld(): void {
    const woodFloorMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        map: this.textures.woodFloor,
        roughness: 0.78,
        metalness: 0.05,
      })
    );
    const stairWoodMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x342317,
        roughness: 0.76,
        metalness: 0.05,
      })
    );
    const darkWoodMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x24170f, roughness: 0.72, metalness: 0.08 })
    );
    const wornWoodMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x3b271a, roughness: 0.85, metalness: 0.04 })
    );
    const livingWallMat = this.trackMat(
      new THREE.MeshStandardMaterial({ map: this.textures.wallpaperLiving, roughness: 0.9, metalness: 0.02 })
    );
    const bedroomWallMat = this.trackMat(
      new THREE.MeshStandardMaterial({ map: this.textures.wallpaperBedroom, roughness: 0.9, metalness: 0.02 })
    );
    const concreteMat = this.trackMat(
      new THREE.MeshStandardMaterial({ map: this.textures.concrete, roughness: 0.92, metalness: 0.05 })
    );
    const sidingMat = this.trackMat(
      new THREE.MeshStandardMaterial({ map: this.textures.siding, roughness: 0.88, metalness: 0.06 })
    );
    const ceilingMat = this.trackMat(
      new THREE.MeshStandardMaterial({ map: this.textures.plasterCeiling, roughness: 0.94, metalness: 0.02 })
    );
    const brassMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x9c7b38, roughness: 0.35, metalness: 0.85 })
    );
    const ironMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x1e2024, roughness: 0.55, metalness: 0.78 })
    );
    const fabricSofaMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x382825, roughness: 0.95, metalness: 0.0 })
    );
    const curtainMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x2a2f36,
        roughness: 0.92,
        side: THREE.DoubleSide,
      })
    );
    const glassMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x7a93ad,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.3,
      })
    );

    this.buildLighting();
    this.buildExterior(sidingMat, darkWoodMat, glassMat);
    this.buildGroundFloorStructure(woodFloorMat, livingWallMat, ceilingMat, darkWoodMat, sidingMat, glassMat);
    this.buildLivingRoomProps(darkWoodMat, wornWoodMat, fabricSofaMat, brassMat, ironMat, curtainMat);
    this.buildHallwayAndUpstairsStairs(stairWoodMat, livingWallMat, darkWoodMat, brassMat, ironMat);
    this.buildUpstairsAndBedroom(
      woodFloorMat,
      bedroomWallMat,
      ceilingMat,
      darkWoodMat,
      wornWoodMat,
      brassMat,
      ironMat,
      curtainMat,
      glassMat
    );
    this.buildBasementAndStairs(concreteMat, darkWoodMat, wornWoodMat, ironMat, brassMat);
    this.buildEntityAndAtmosphere();
  }

  private buildLighting(): void {
    const hemi = new THREE.HemisphereLight(0x5a7091, 0x16120e, 0.44);
    this.group.add(hemi);

    this.moonLight = new THREE.DirectionalLight(0xa8b6c8, 0.85);
    this.moonLight.position.set(-14, 16, 10);
    if (!this.isSoftwareGl) {
      this.moonLight.castShadow = true;
      this.moonLight.shadow.mapSize.set(1024, 1024);
      this.moonLight.shadow.camera.near = 2;
      this.moonLight.shadow.camera.far = 42;
      const d = 14;
      this.moonLight.shadow.camera.left = -d;
      this.moonLight.shadow.camera.right = d;
      this.moonLight.shadow.camera.top = d;
      this.moonLight.shadow.camera.bottom = -d;
      this.moonLight.shadow.bias = -0.0005;
      this.moonLight.shadow.normalBias = 0.02;
    }
    this.group.add(this.moonLight);

    this.livingLampLight = new THREE.PointLight(0xffb56b, 1.8, 10, 1.6);
    this.livingLampLight.position.set(-4.3, 1.45, 4.1);
    this.group.add(this.livingLampLight);

    const hallFill = new THREE.PointLight(0xc29e70, 0.72, 9, 1.7);
    hallFill.position.set(3.4, 2.75, 1.0);
    this.group.add(hallFill);

    this.upstairsSconceLight = new THREE.PointLight(0xd99b5e, 1.1, 9, 1.7);
    this.upstairsSconceLight.position.set(3.0, 5.8, -2.5);
    this.group.add(this.upstairsSconceLight);

    const bedroomMoon = new THREE.PointLight(0x88a2c4, 1.05, 9, 1.5);
    bedroomMoon.position.set(-4.2, 5.3, 0.0);
    this.group.add(bedroomMoon);

    this.basementBulbLight = new THREE.PointLight(0xd6c08d, 0.95, 11, 1.8);
    this.basementBulbLight.position.set(-1.0, -1.0, -13.5);
    this.group.add(this.basementBulbLight);
  }

  private buildExterior(
    sidingMat: THREE.Material,
    darkWoodMat: THREE.Material,
    glassMat: THREE.Material
  ): void {
    const groundMat = this.trackMat(
      new THREE.MeshStandardMaterial({ map: this.textures.gravel, roughness: 0.96, metalness: 0.0 })
    );

    // 4 exterior yard slabs strictly OUTSIDE the house & basement footprint
    // House + basement footprint is X: -5.75..5.85, Z: -18.5..5.6
    // Top of yard sits at Y = -0.02 so it NEVER Z-fights with interior floor (top = 0.0) or basement ceiling.
    this.group.add(this.makeBox(48, 0.2, 22.4, groundMat, 0, -0.12, 16.8, false, true)); // South front yard (Z: 5.6..28)
    this.group.add(this.makeBox(48, 0.2, 12.0, groundMat, 0, -0.12, -24.5, false, true)); // North back yard (Z: -30.5..-18.5)
    this.group.add(this.makeBox(18.25, 0.2, 24.1, groundMat, -14.875, -0.12, -6.45, false, true)); // West side yard
    this.group.add(this.makeBox(18.15, 0.2, 24.1, groundMat, 14.925, -0.12, -6.45, false, true)); // East side yard

    // Gravel walkway to porch (Z: 7.9..18.5, top Y = 0.01)
    const pathMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x252726,
        roughness: 0.95,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    this.group.add(this.makeBox(2.4, 0.03, 10.6, pathMat, 0, -0.005, 13.2));

    // Wooden Porch (Z: 5.62..7.72, Y: -0.02..0.14)
    this.group.add(this.makeBox(4.8, 0.16, 2.1, darkWoodMat, 0, 0.06, 6.67));
    // Porch steps (Z: 7.72..8.22, Y: -0.02..0.07)
    this.group.add(this.makeBox(2.4, 0.09, 0.5, darkWoodMat, 0, 0.025, 7.97));
    // Porch pillars & overhang roof
    this.group.add(this.makeBox(0.18, 2.9, 0.18, darkWoodMat, -2.1, 1.5, 7.5, true));
    this.group.add(this.makeBox(0.18, 2.9, 0.18, darkWoodMat, 2.1, 1.5, 7.5, true));
    this.group.add(this.makeBox(5.2, 0.18, 2.5, darkWoodMat, 0, 3.05, 6.75, true));

    // Yard perimeter colliders
    this.addCollider(-13, -12, -1, 5, -6, 20);
    this.addCollider(12, 13, -1, 5, -6, 20);
    this.addCollider(-13, 13, -1, 5, 19.5, 20.5);
    this.addCollider(-13, 13, -1, 5, -19.5, -19.0);

    // Pitched Main Roof over house
    const roofMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.92 })
    );
    const leftSlope = this.makeBox(6.8, 0.22, 11.4, roofMat, -2.85, 8.2, 0.5);
    leftSlope.rotation.z = 0.46;
    const rightSlope = this.makeBox(6.8, 0.22, 11.4, roofMat, 2.85, 8.2, 0.5);
    rightSlope.rotation.z = -0.46;
    this.group.add(leftSlope, rightSlope);

    const gableGeo = this.trackGeo(new THREE.ConeGeometry(6.2, 2.8, 4));
    const gable = new THREE.Mesh(gableGeo, sidingMat);
    gable.rotation.y = Math.PI / 4;
    gable.scale.set(1.3, 1, 1.25);
    gable.position.set(0, 8.2, 0.5);
    this.group.add(gable);

    // Exterior Front Dimly Illuminated Window
    this.exteriorWindowMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x2a241b,
        emissive: 0x7a5122,
        emissiveIntensity: 0.85,
        roughness: 0.3,
      })
    );
    const litWin = this.makeBox(1.3, 1.6, 0.06, this.exteriorWindowMat, -2.4, 5.1, 5.74);
    const litWinFrame = this.makeBox(1.48, 1.78, 0.06, darkWoodMat, -2.4, 5.1, 5.7);
    this.group.add(litWinFrame, litWin);

    // Dark unlit exterior windows
    const darkWin = this.makeBox(1.3, 1.6, 0.06, glassMat, 2.4, 5.1, 5.74);
    const darkWinFrame = this.makeBox(1.48, 1.78, 0.06, darkWoodMat, 2.4, 5.1, 5.7);
    const lowerWin = this.makeBox(1.5, 1.5, 0.06, glassMat, -2.8, 1.7, 5.74);
    const lowerWinFrame = this.makeBox(1.68, 1.68, 0.06, darkWoodMat, -2.8, 1.7, 5.7);
    this.group.add(darkWinFrame, darkWin, lowerWinFrame, lowerWin);

    // Dead twisted trees
    const barkMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x1a1714, roughness: 0.96 })
    );
    const treePositions: [number, number, number][] = [
      [-8.5, 11.5, 1.1],
      [8.2, 12.2, 1.25],
      [-9.8, 5.0, 1.0],
      [9.4, 3.8, 1.3],
      [-7.2, 16.5, 0.9],
      [7.4, 17.0, 1.05],
    ];
    treePositions.forEach(([tx, tz, sc]) => {
      const tree = new THREE.Group();
      tree.position.set(tx, -0.02, tz);
      const trunk = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.18 * sc, 0.35 * sc, 5.2 * sc, 7)),
        barkMat
      );
      trunk.position.y = 2.6 * sc;
      trunk.rotation.z = (tx > 0 ? -1 : 1) * 0.08;
      const branch1 = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.06 * sc, 0.13 * sc, 2.4 * sc, 6)),
        barkMat
      );
      branch1.position.set(0.6 * sc, 4.1 * sc, 0);
      branch1.rotation.z = -0.7;
      const branch2 = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.05 * sc, 0.11 * sc, 2.1 * sc, 6)),
        barkMat
      );
      branch2.position.set(-0.55 * sc, 3.6 * sc, 0.2 * sc);
      branch2.rotation.z = 0.75;
      tree.add(trunk, branch1, branch2);
      this.group.add(tree);
      this.addCollider(tx - 0.45, tx + 0.45, 0, 5, tz - 0.45, tz + 0.45);
    });

    // Broken wooden fence pickets along front yard sides
    for (let x = -11; x <= 11; x += 1.4) {
      if (Math.abs(x) < 2.1) continue;
      this.group.add(this.makeBox(0.12, 1.05, 0.08, darkWoodMat, x, 0.5, 17.8));
    }
    this.group.add(this.makeBox(9.2, 0.09, 0.06, darkWoodMat, -6.6, 0.75, 17.8));
    this.group.add(this.makeBox(9.2, 0.09, 0.06, darkWoodMat, 6.6, 0.75, 17.8));
    this.addCollider(-12, -2.0, 0, 2, 17.5, 18.1);
    this.addCollider(2.0, 12, 0, 2, 17.5, 18.1);

    // Prevent walking around behind exterior walls into basement void (leaving basement stairwell gap X: 2.35..3.85 clear)
    this.addCollider(-6.2, -5.6, -1, 4, -5.0, 5.6);
    this.addCollider(5.6, 6.2, -1, 4, -5.0, 5.6);
    this.addCollider(-6.2, 2.35, -1, 4, -5.2, -4.5);
    this.addCollider(3.85, 6.2, -1, 4, -5.2, -4.5);
  }

  private buildGroundFloorStructure(
    woodFloorMat: THREE.Material,
    livingWallMat: THREE.Material,
    ceilingMat: THREE.Material,
    darkWoodMat: THREE.Material,
    sidingMat: THREE.Material,
    glassMat: THREE.Material
  ): void {
    // Ground Floor Slab: X -5.6..5.65, Z -4.5..5.5, Y: -0.14..0.0 (top strictly at Y = 0.0)
    this.group.add(this.makeBox(11.25, 0.14, 10.0, woodFloorMat, 0.025, -0.07, 0.5));

    // West Wall (X = -5.55) with bay window cutout at Z: 0.2..2.8
    this.group.add(this.makeBox(0.18, 3.45, 4.7, livingWallMat, -5.55, 1.725, -2.15));
    this.group.add(this.makeBox(0.18, 3.45, 2.7, livingWallMat, -5.55, 1.725, 4.15));
    this.group.add(this.makeBox(0.18, 0.9, 2.6, livingWallMat, -5.55, 0.45, 1.5));
    this.group.add(this.makeBox(0.18, 1.0, 2.6, livingWallMat, -5.55, 2.95, 1.5));
    this.group.add(this.makeBox(0.04, 1.55, 2.6, glassMat, -5.55, 1.68, 1.5));
    // Exterior siding cleanly offset outside West wall (X = -5.72)
    this.group.add(this.makeBox(0.08, 7.0, 10.2, sidingMat, -5.72, 3.48, 0.5));
    this.addCollider(-5.85, -5.42, 0, 3.5, -4.6, 5.6);

    // East Wall (X = 5.65) + exterior siding at X = 5.82
    this.group.add(this.makeBox(0.18, 7.0, 10.1, livingWallMat, 5.65, 3.48, 0.5));
    this.group.add(this.makeBox(0.08, 7.0, 10.2, sidingMat, 5.82, 3.48, 0.5));
    this.addCollider(5.52, 5.85, 0, 7.0, -4.6, 5.6);

    // South Wall (Z = 5.5) with Front Doorway X: -0.65..0.65
    this.group.add(this.makeBox(4.9, 3.45, 0.18, livingWallMat, -3.1, 1.725, 5.48));
    this.group.add(this.makeBox(4.9, 3.45, 0.18, livingWallMat, 3.1, 1.725, 5.48));
    this.group.add(this.makeBox(1.4, 0.9, 0.18, livingWallMat, 0, 3.0, 5.48));
    // Exterior South facade offset cleanly at Z = 5.64
    this.group.add(this.makeBox(4.9, 3.45, 0.08, sidingMat, -3.1, 1.725, 5.64));
    this.group.add(this.makeBox(4.9, 3.45, 0.08, sidingMat, 3.1, 1.725, 5.64));
    this.group.add(this.makeBox(11.4, 3.6, 0.18, sidingMat, 0.05, 5.25, 5.6));
    this.addCollider(-5.7, -0.68, 0, 3.5, 5.36, 5.68);
    this.addCollider(0.68, 5.7, 0, 3.5, 5.36, 5.68);

    // Front Door (Hinged at X = -0.65, Z = 5.5)
    this.frontDoorPivot = new THREE.Group();
    this.frontDoorPivot.position.set(-0.65, 0.08, 5.5);
    const frontDoorLeaf = this.makeBox(1.3, 2.45, 0.08, darkWoodMat, 0.65, 1.22, 0, true);
    const frontKnob = new THREE.Mesh(
      this.trackGeo(new THREE.SphereGeometry(0.055, 10, 10)),
      this.trackMat(new THREE.MeshStandardMaterial({ color: 0x9c7b38, roughness: 0.35, metalness: 0.85 }))
    );
    frontKnob.position.set(1.14, 1.05, 0.06);
    const frontKnobBack = frontKnob.clone();
    frontKnobBack.position.z = -0.06;
    this.frontDoorPivot.add(frontDoorLeaf, frontKnob, frontKnobBack);
    this.group.add(this.frontDoorPivot);
    this.frontDoorCollider = this.addCollider(-0.68, 0.68, 0, 2.6, 5.38, 5.64, 'front_door');
    this.addInteractive(
      'front_door',
      'EXAMINE FRONT DOOR',
      'Living Room',
      this.frontDoorPivot,
      new THREE.Vector3(0, 1.2, 5.5),
      [1.4, 2.5, 0.4],
      2.6
    );

    // North Wall (Z = -4.5) with Basement Doorway X: 2.45..3.75
    this.group.add(this.makeBox(8.0, 3.45, 0.18, livingWallMat, -1.55, 1.725, -4.5));
    this.group.add(this.makeBox(1.9, 3.45, 0.18, livingWallMat, 4.7, 1.725, -4.5));
    this.group.add(this.makeBox(1.3, 0.9, 0.18, livingWallMat, 3.1, 3.0, -4.5));
    this.addCollider(-5.6, 2.45, 0, 3.5, -4.64, -4.36);
    this.addCollider(3.75, 5.7, 0, 3.5, -4.64, -4.36);

    // Basement Door (Hinged at X = 2.45, Z = -4.5)
    this.basementDoorPivot = new THREE.Group();
    this.basementDoorPivot.position.set(2.45, 0, -4.5);
    const bLeaf = this.makeBox(1.3, 2.5, 0.08, darkWoodMat, 0.65, 1.25, 0, true);
    const bPlate = this.makeBox(0.12, 0.35, 0.1, darkWoodMat, 1.12, 1.1, 0);
    const bKnob = new THREE.Mesh(
      this.trackGeo(new THREE.SphereGeometry(0.05, 10, 10)),
      this.trackMat(new THREE.MeshStandardMaterial({ color: 0x706552, roughness: 0.45, metalness: 0.75 }))
    );
    bKnob.position.set(1.12, 1.1, 0.06);
    this.basementDoorPivot.add(bLeaf, bPlate, bKnob);
    this.group.add(this.basementDoorPivot);
    this.basementDoorCollider = this.addCollider(2.45, 3.75, 0, 2.6, -4.64, -4.36, 'basement_door');
    this.addInteractive(
      'basement_door',
      'OPEN BASEMENT DOOR',
      'Main Hallway',
      this.basementDoorPivot,
      new THREE.Vector3(3.1, 1.2, -4.5),
      [1.35, 2.5, 0.4],
      2.6
    );

    // Living/Hallway Partition Wall at X = 2.2 (Archway open Z: 0.4..3.2)
    this.group.add(this.makeBox(0.18, 3.4, 4.9, livingWallMat, 2.2, 1.7, -2.05));
    this.group.add(this.makeBox(0.18, 3.4, 2.3, livingWallMat, 2.2, 1.7, 4.35));
    this.group.add(this.makeBox(0.18, 0.85, 2.8, livingWallMat, 2.2, 2.98, 1.8));
    this.addCollider(2.08, 2.32, 0, 3.5, -4.5, 0.4);
    this.addCollider(2.08, 2.32, 0, 3.5, 3.2, 5.5);

    // Ground Floor Ceiling (Y: 3.38..3.48) — strictly separated from Upstairs Floor (Y: 3.50..3.64)
    this.group.add(this.makeBox(9.6, 0.1, 10.0, ceilingMat, -0.75, 3.43, 0.5));
    this.group.add(this.makeBox(1.55, 0.1, 3.3, ceilingMat, 4.82, 3.43, -2.85));
    this.group.add(this.makeBox(1.55, 0.1, 1.3, ceilingMat, 4.82, 3.43, 4.85));
  }

  private buildLivingRoomProps(
    darkWoodMat: THREE.Material,
    wornWoodMat: THREE.Material,
    fabricSofaMat: THREE.Material,
    brassMat: THREE.Material,
    ironMat: THREE.Material,
    curtainMat: THREE.Material
  ): void {
    const rugMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        map: this.textures.rug,
        roughness: 0.96,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    // Raised 1.2cm above Y=0 floor to prevent Z-fighting
    this.group.add(this.makeBox(3.6, 0.016, 4.4, rugMat, -2.4, 0.014, 2.3));

    // Old Sofa
    const sofa = new THREE.Group();
    sofa.position.set(-4.1, 0, 2.3);
    sofa.add(this.makeBox(0.95, 0.36, 2.2, fabricSofaMat, 0, 0.24, 0, true));
    sofa.add(this.makeBox(0.24, 0.72, 2.2, fabricSofaMat, -0.36, 0.56, 0, true));
    sofa.add(this.makeBox(0.95, 0.48, 0.2, fabricSofaMat, 0, 0.4, -1.0, true));
    sofa.add(this.makeBox(0.95, 0.48, 0.2, fabricSofaMat, 0, 0.4, 1.0, true));
    sofa.add(this.makeBox(0.68, 0.14, 0.85, fabricSofaMat, 0.06, 0.48, -0.45));
    sofa.add(this.makeBox(0.68, 0.14, 0.85, fabricSofaMat, 0.06, 0.48, 0.45));
    this.group.add(sofa);
    this.addCollider(-4.65, -3.55, 0, 1.1, 1.15, 3.45);

    // Wooden Coffee Table
    const table = new THREE.Group();
    table.position.set(-2.1, 0, 2.3);
    table.add(this.makeBox(0.86, 0.06, 1.38, wornWoodMat, 0, 0.44, 0, true));
    [
      [-0.36, -0.6],
      [0.36, -0.6],
      [-0.36, 0.6],
      [0.36, 0.6],
    ].forEach(([lx, lz]) => {
      table.add(this.makeBox(0.07, 0.41, 0.07, darkWoodMat, lx, 0.205, lz));
    });
    this.group.add(table);
    this.addCollider(-2.55, -1.65, 0, 0.6, 1.58, 3.02);

    // OLD DIARY on Coffee Table
    this.diaryMesh = new THREE.Group();
    this.diaryMesh.position.set(-2.05, 0.48, 2.3);
    this.diaryMesh.rotation.y = 0.24;
    const diaryCover = this.makeBox(
      0.24,
      0.032,
      0.32,
      this.trackMat(new THREE.MeshStandardMaterial({ color: 0x3b1d14, roughness: 0.82 })),
      0,
      0.016,
      0
    );
    const diaryPages = this.makeBox(
      0.21,
      0.024,
      0.29,
      this.trackMat(new THREE.MeshStandardMaterial({ color: 0xc2b293, roughness: 0.9 })),
      0.018,
      0.018,
      0
    );
    const diaryClasp = this.makeBox(0.03, 0.035, 0.05, brassMat, 0.125, 0.018, 0);
    this.diaryMesh.add(diaryCover, diaryPages, diaryClasp);
    this.group.add(this.diaryMesh);
    this.addInteractive(
      'old_diary',
      'READ DIARY',
      'Living Room',
      this.diaryMesh,
      new THREE.Vector3(-2.05, 0.55, 2.3),
      [0.5, 0.35, 0.5],
      2.5
    );

    // Stopped Wall Clock (10:15)
    const clockGroup = new THREE.Group();
    clockGroup.position.set(-5.38, 2.05, -1.4);
    clockGroup.add(this.makeBox(0.14, 0.72, 0.48, darkWoodMat, 0, 0, 0, true));
    const dialGeo = this.trackGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24));
    const dialMat = this.trackMat(
      new THREE.MeshStandardMaterial({ map: this.textures.clockFace, roughness: 0.5 })
    );
    const dial = new THREE.Mesh(dialGeo, dialMat);
    dial.rotation.z = Math.PI / 2;
    dial.position.set(0.08, 0.12, 0);
    const pendulum = this.makeBox(0.03, 0.25, 0.03, brassMat, 0.075, -0.18, 0);
    clockGroup.add(dial, pendulum);
    this.group.add(clockGroup);
    this.addInteractive(
      'wall_clock',
      'EXAMINE CLOCK',
      'Living Room',
      clockGroup,
      new THREE.Vector3(-5.3, 2.05, -1.4),
      [0.35, 0.85, 0.65],
      2.7
    );

    // Old CRT Television
    const tvGroup = new THREE.Group();
    tvGroup.position.set(-4.4, 0, -3.2);
    tvGroup.rotation.y = 0.42;
    tvGroup.add(this.makeBox(0.76, 0.55, 0.55, darkWoodMat, 0, 0.275, 0, true));
    tvGroup.add(this.makeBox(0.68, 0.52, 0.48, wornWoodMat, 0, 0.82, 0, true));
    this.crtMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        map: this.textures.crtScreen,
        emissive: 0x1a2630,
        emissiveIntensity: 0.25,
        roughness: 0.25,
      })
    );
    tvGroup.add(this.makeBox(0.54, 0.4, 0.04, this.crtMat, 0, 0.83, 0.25));
    const antGeo = this.trackGeo(new THREE.CylinderGeometry(0.008, 0.008, 0.45, 6));
    const ant1 = new THREE.Mesh(antGeo, ironMat);
    ant1.position.set(-0.1, 1.24, 0);
    ant1.rotation.z = 0.45;
    const ant2 = new THREE.Mesh(antGeo, ironMat);
    ant2.position.set(0.1, 1.24, 0);
    ant2.rotation.z = -0.45;
    tvGroup.add(ant1, ant2);
    this.group.add(tvGroup);
    this.addCollider(-4.95, -3.85, 0, 1.4, -3.75, -2.65);

    // Old Cabinet & Bookshelf
    const cabinet = new THREE.Group();
    cabinet.position.set(-1.8, 0, -4.05);
    cabinet.add(this.makeBox(1.8, 2.0, 0.46, darkWoodMat, 0, 1.0, 0, true));
    const bookColors = [0x4c2320, 0x22362a, 0x2b2d42, 0x4f3f26, 0x3b2833];
    for (let s = 0; s < 3; s++) {
      const sy = 0.55 + s * 0.5;
      cabinet.add(this.makeBox(1.66, 0.04, 0.4, wornWoodMat, 0, sy, 0.06));
      for (let b = 0; b < 6; b++) {
        const bMat = this.trackMat(
          new THREE.MeshStandardMaterial({ color: bookColors[(s + b) % bookColors.length], roughness: 0.85 })
        );
        cabinet.add(this.makeBox(0.06, 0.28 + (b % 3) * 0.03, 0.24, bMat, -0.62 + b * 0.11, sy + 0.16, 0.08));
      }
    }
    this.group.add(cabinet);
    this.addCollider(-2.75, -0.85, 0, 2.1, -4.35, -3.75);

    // Living Room Framed Family Photo
    const frameGroup = new THREE.Group();
    frameGroup.position.set(-1.25, 1.22, -3.78);
    frameGroup.add(this.makeBox(0.28, 0.34, 0.03, darkWoodMat, 0, 0, 0));
    frameGroup.add(
      this.makeBox(
        0.22,
        0.28,
        0.02,
        this.trackMat(new THREE.MeshStandardMaterial({ map: this.textures.familyPhoto, roughness: 0.6 })),
        0,
        0,
        0.02
      )
    );
    this.group.add(frameGroup);

    // Chair that shifts subtly during first supernatural event
    this.shiftChairGroup = new THREE.Group();
    this.shiftChairGroup.position.set(0.4, 0, -3.1);
    this.shiftChairGroup.rotation.y = 0.2;
    this.shiftChairGroup.add(this.makeBox(0.56, 0.07, 0.56, wornWoodMat, 0, 0.47, 0, true));
    this.shiftChairGroup.add(this.makeBox(0.56, 0.55, 0.07, darkWoodMat, 0, 0.78, -0.24, true));
    [
      [-0.22, -0.22],
      [0.22, -0.22],
      [-0.22, 0.22],
      [0.22, 0.22],
    ].forEach(([lx, lz]) => {
      this.shiftChairGroup.add(this.makeBox(0.06, 0.43, 0.06, darkWoodMat, lx, 0.215, lz));
    });
    this.group.add(this.shiftChairGroup);
    this.addCollider(0.05, 0.75, 0, 1.1, -3.45, -2.75);

    // Side Table + Dim Lamp
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-4.5, 0, 4.3);
    lampGroup.add(this.makeBox(0.56, 0.62, 0.56, darkWoodMat, 0, 0.31, 0, true));
    const lampBase = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.08, 0.12, 0.28, 12)),
      brassMat
    );
    lampBase.position.y = 0.76;
    const lampShade = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.14, 0.24, 0.26, 14, 1, true)),
      this.trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x735c40,
          emissive: 0x5c3917,
          emissiveIntensity: 0.7,
          side: THREE.DoubleSide,
          roughness: 0.85,
        })
      )
    );
    lampShade.position.y = 0.98;
    lampGroup.add(lampBase, lampShade);
    this.group.add(lampGroup);
    this.addCollider(-4.85, -4.15, 0, 1.2, 3.95, 4.65);

    // Dusty Curtains
    const cLeft = this.makeBox(0.08, 2.0, 0.55, curtainMat, -5.36, 1.7, 0.18);
    const cRight = this.makeBox(0.08, 2.0, 0.55, curtainMat, -5.36, 1.7, 2.82);
    this.curtains.push(cLeft, cRight);
    this.group.add(cLeft, cRight);
  }

  private buildHallwayAndUpstairsStairs(
    stairWoodMat: THREE.Material,
    wallMat: THREE.Material,
    darkWoodMat: THREE.Material,
    brassMat: THREE.Material,
    ironMat: THREE.Material
  ): void {
    const runnerMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        map: this.textures.rug,
        roughness: 0.96,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    // Raised 1.2cm above floor so zero Z-fighting
    this.group.add(this.makeBox(1.2, 0.015, 7.2, runnerMat, 3.1, 0.013, 0.2));

    // Hallway Console Table (X: 2.52, Z: -2.2) holding BASEMENT KEY
    const consoleTable = new THREE.Group();
    consoleTable.position.set(2.52, 0, -2.2);
    consoleTable.add(this.makeBox(0.46, 0.06, 1.15, darkWoodMat, 0, 0.78, 0, true));
    [
      [-0.17, -0.48],
      [0.17, -0.48],
      [-0.17, 0.48],
      [0.17, 0.48],
    ].forEach(([lx, lz]) => {
      consoleTable.add(this.makeBox(0.06, 0.75, 0.06, darkWoodMat, lx, 0.375, lz));
    });
    consoleTable.add(this.makeBox(0.22, 0.02, 0.34, brassMat, 0.02, 0.82, 0));
    this.group.add(consoleTable);
    this.addCollider(2.28, 2.78, 0, 0.9, -2.85, -1.55);

    // BASEMENT KEY
    this.basementKeyMesh = new THREE.Group();
    this.basementKeyMesh.position.set(2.55, 0.845, -2.2);
    this.basementKeyMesh.rotation.y = 0.4;
    const keyRing = new THREE.Mesh(
      this.trackGeo(new THREE.TorusGeometry(0.032, 0.008, 8, 16)),
      brassMat
    );
    keyRing.rotation.x = Math.PI / 2;
    const keyShaft = this.makeBox(0.11, 0.012, 0.012, ironMat, 0.08, 0, 0);
    const keyTeeth = this.makeBox(0.03, 0.012, 0.028, ironMat, 0.12, 0, 0.015);
    this.basementKeyMesh.add(keyRing, keyShaft, keyTeeth);
    this.group.add(this.basementKeyMesh);
    this.addInteractive(
      'basement_key',
      'PICK UP BASEMENT KEY',
      'Main Hallway',
      this.basementKeyMesh,
      new THREE.Vector3(2.55, 0.86, -2.2),
      [0.45, 0.35, 0.55],
      2.5
    );

    // Faded Painting on Hallway Wall
    const pFrame1 = this.makeBox(0.05, 0.85, 0.65, darkWoodMat, 2.32, 1.8, 0.0);
    const pArt1 = this.makeBox(
      0.02,
      0.7,
      0.5,
      this.trackMat(new THREE.MeshStandardMaterial({ color: 0x232421, roughness: 0.9 })),
      2.355,
      1.8,
      0.0
    );
    this.group.add(pFrame1, pArt1);

    // Upstairs Staircase (X: 4.13..5.52, Z: 3.8 -> -1.2, Y: 0.0 -> 3.64)
    // Strictly non-overlapping treads & risers (each step has exact stepD with zero overlap)
    const steps = 15;
    const zStart = 3.8;
    const zEnd = -1.2;
    const stepD = (zStart - zEnd) / steps;
    const stepH = 3.64 / steps;
    for (let i = 0; i < steps; i++) {
      const sz = zStart - (i + 0.5) * stepD;
      const topY = (i + 1) * stepH;
      const sy = topY - stepH * 0.5;
      // Exact step block with 0.002m micro-trim so adjacent edges never Z-fight
      this.group.add(
        this.makeBox(1.38, stepH - 0.002, stepD - 0.002, stairWoodMat, 4.825, sy, sz, false, true)
      );
      // Slight overhanging stair nosing tread cap for realistic silhouette
      this.group.add(
        this.makeBox(1.40, 0.024, stepD + 0.015, darkWoodMat, 4.825, topY - 0.012, sz + 0.008, false, true)
      );
    }

    // Sloped stair stringer / soffit underneath so no gaps are visible from downstairs
    const stairRun = zStart - zEnd;
    const stairLen = Math.hypot(stairRun, 3.64);
    const stringer = this.makeBox(1.38, 0.18, stairLen, darkWoodMat, 4.825, 1.65, 1.3);
    stringer.rotation.x = Math.atan2(3.64, stairRun);
    this.group.add(stringer);

    // Staircase left partition wall (ends cleanly at bottom step Z = 3.8)
    this.group.add(this.makeBox(0.14, 3.5, 5.0, wallMat, 4.05, 1.75, 1.3));
    this.addCollider(3.92, 4.18, 0, 4.5, -1.2, 3.8);
  }

  private buildUpstairsAndBedroom(
    woodFloorMat: THREE.Material,
    bedroomWallMat: THREE.Material,
    ceilingMat: THREE.Material,
    darkWoodMat: THREE.Material,
    wornWoodMat: THREE.Material,
    brassMat: THREE.Material,
    ironMat: THREE.Material,
    curtainMat: THREE.Material,
    glassMat: THREE.Material
  ): void {
    // Upstairs Floor Slab (Y: 3.50..3.64, walkable top = 3.64)
    // Leaves stairwell cutout X: 4.05..5.6, Z: -1.2..4.2 open!
    this.group.add(this.makeBox(9.6, 0.14, 10.0, woodFloorMat, -0.75, 3.57, 0.5));
    this.group.add(this.makeBox(1.55, 0.14, 3.3, woodFloorMat, 4.82, 3.57, -2.85));
    this.group.add(this.makeBox(1.55, 0.14, 1.3, woodFloorMat, 4.82, 3.57, 4.85));

    // Stairwell Railing on Upstairs Landing
    this.group.add(this.makeBox(0.08, 0.95, 5.4, darkWoodMat, 4.05, 4.115, 1.5));
    this.group.add(this.makeBox(1.5, 0.95, 0.08, darkWoodMat, 4.8, 4.115, 4.2));
    this.addCollider(3.96, 4.14, 3.5, 5.5, -1.2, 4.2);
    this.addCollider(4.0, 5.6, 3.5, 5.5, 4.1, 4.3);

    // Upstairs Outer Walls (Y: 3.64..6.9)
    // West Wall (X = -5.55) with Bedroom Window Z: -1.2..1.2
    this.group.add(this.makeBox(0.18, 3.3, 3.3, bedroomWallMat, -5.55, 5.29, -2.85));
    this.group.add(this.makeBox(0.18, 3.3, 4.3, bedroomWallMat, -5.55, 5.29, 3.35));
    this.group.add(this.makeBox(0.18, 0.9, 2.4, bedroomWallMat, -5.55, 4.09, 0));
    this.group.add(this.makeBox(0.18, 0.9, 2.4, bedroomWallMat, -5.55, 6.49, 0));
    this.group.add(this.makeBox(0.04, 1.5, 2.4, glassMat, -5.55, 5.29, 0));
    this.addCollider(-5.85, -5.42, 3.5, 7.0, -4.6, 5.6);

    // North Wall & South Wall
    this.group.add(this.makeBox(11.3, 3.3, 0.18, bedroomWallMat, 0.05, 5.29, -4.5));
    this.group.add(this.makeBox(11.3, 3.3, 0.18, bedroomWallMat, 0.05, 5.29, 5.48));
    this.addCollider(-5.7, 5.7, 3.5, 7.0, -4.65, -4.35);
    this.addCollider(-5.7, 5.7, 3.5, 7.0, 5.35, 5.65);

    // Upstairs Ceiling (Y = 6.95)
    this.group.add(this.makeBox(11.3, 0.14, 10.2, ceilingMat, 0.05, 6.98, 0.5));

    // Bedroom Partition Wall at X = 1.6 (Doorway open Z: -3.4..-2.0)
    this.group.add(this.makeBox(0.18, 3.3, 1.1, bedroomWallMat, 1.6, 5.29, -3.95));
    this.group.add(this.makeBox(0.18, 3.3, 7.5, bedroomWallMat, 1.6, 5.29, 1.75));
    this.group.add(this.makeBox(0.18, 0.9, 1.4, bedroomWallMat, 1.6, 6.49, -2.7));
    this.addCollider(1.48, 1.72, 3.5, 7.0, -4.5, -3.4);
    this.addCollider(1.48, 1.72, 3.5, 7.0, -2.0, 5.5);

    // Slightly ajar bedroom door leaf
    const bedDoor = this.makeBox(0.08, 2.45, 1.3, darkWoodMat, 1.15, 4.86, -1.65, true);
    bedDoor.rotation.y = 0.72;
    this.group.add(bedDoor);

    // Torn swaying curtains
    const bc1 = this.makeBox(0.07, 1.9, 0.5, curtainMat, -5.38, 5.3, -1.1);
    const bc2 = this.makeBox(0.07, 1.9, 0.5, curtainMat, -5.38, 5.3, 1.1);
    this.curtains.push(bc1, bc2);
    this.group.add(bc1, bc2);

    // BEDROOM PROPS (resting cleanly on Y = 3.64)
    const bed = new THREE.Group();
    bed.position.set(-3.9, 3.64, -2.7);
    const sheetMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0x5c5b57, roughness: 0.95 }));
    const blanketMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0x2f343d, roughness: 0.94 }));
    bed.add(this.makeBox(2.05, 0.24, 1.5, darkWoodMat, 0, 0.34, 0, true));
    bed.add(this.makeBox(1.92, 0.2, 1.38, sheetMat, 0.04, 0.56, 0));
    bed.add(this.makeBox(1.25, 0.22, 1.4, blanketMat, 0.38, 0.58, 0));
    bed.add(this.makeBox(0.32, 0.12, 0.62, sheetMat, -0.7, 0.72, -0.32));
    bed.add(this.makeBox(0.32, 0.12, 0.62, sheetMat, -0.7, 0.72, 0.32));
    bed.add(this.makeBox(0.08, 1.25, 1.52, ironMat, -1.04, 0.62, 0));
    bed.add(this.makeBox(0.08, 0.85, 1.52, ironMat, 1.04, 0.42, 0));
    this.group.add(bed);
    this.addCollider(-5.0, -2.8, 3.6, 5.0, -3.55, -1.85);

    // Nightstand + Broken Lamp + OLD PHOTOGRAPH
    const nightstand = new THREE.Group();
    nightstand.position.set(-2.1, 3.64, -3.95);
    nightstand.add(this.makeBox(0.68, 0.68, 0.58, darkWoodMat, 0, 0.34, 0, true));
    nightstand.add(this.makeBox(0.56, 0.18, 0.04, wornWoodMat, 0, 0.5, 0.31));
    const bLampBase = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.06, 0.09, 0.22, 10)),
      brassMat
    );
    bLampBase.position.set(-0.18, 0.79, -0.08);
    const bLampShade = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.11, 0.17, 0.2, 10, 1, true)),
      this.trackMat(new THREE.MeshStandardMaterial({ color: 0x45403a, roughness: 0.9, side: THREE.DoubleSide }))
    );
    bLampShade.position.set(-0.16, 0.96, -0.06);
    bLampShade.rotation.z = 0.42;
    nightstand.add(bLampBase, bLampShade);
    this.group.add(nightstand);
    this.addCollider(-2.5, -1.7, 3.6, 4.8, -4.35, -3.6);

    // OLD PHOTOGRAPH
    this.photoMesh = new THREE.Group();
    this.photoMesh.position.set(-1.95, 4.33, -3.88);
    this.photoMesh.rotation.y = -0.35;
    this.photoMesh.add(
      this.makeBox(
        0.2,
        0.012,
        0.16,
        this.trackMat(new THREE.MeshStandardMaterial({ map: this.textures.familyPhoto, roughness: 0.55 })),
        0,
        0.008,
        0
      )
    );
    this.group.add(this.photoMesh);
    this.addInteractive(
      'old_photograph',
      'INSPECT PHOTOGRAPH',
      'Bedroom',
      this.photoMesh,
      new THREE.Vector3(-1.95, 4.36, -3.88),
      [0.45, 0.35, 0.45],
      2.5
    );

    // Dusty Wardrobe
    const wardrobe = new THREE.Group();
    wardrobe.position.set(0.75, 3.64, -4.0);
    wardrobe.add(this.makeBox(1.25, 2.25, 0.65, darkWoodMat, 0, 1.125, 0, true));
    wardrobe.add(this.makeBox(0.58, 2.1, 0.04, wornWoodMat, -0.31, 1.125, 0.35));
    const ajarDoor = this.makeBox(0.58, 2.1, 0.04, wornWoodMat, 0.34, 1.125, 0.46);
    ajarDoor.rotation.y = -0.32;
    wardrobe.add(ajarDoor);
    this.group.add(wardrobe);
    this.addCollider(0.05, 1.45, 3.6, 6.0, -4.4, -3.55);

    // Vanity Mirror
    const vanity = new THREE.Group();
    vanity.position.set(-5.15, 3.64, 2.3);
    vanity.add(this.makeBox(0.55, 0.76, 1.25, darkWoodMat, 0, 0.38, 0, true));
    vanity.add(this.makeBox(0.08, 1.35, 0.95, darkWoodMat, -0.22, 1.4, 0, true));
    const mirrorSurface = this.makeBox(
      0.03,
      1.15,
      0.78,
      this.trackMat(new THREE.MeshStandardMaterial({ color: 0x6f7b87, roughness: 0.12, metalness: 0.92 })),
      -0.17,
      1.4,
      0
    );
    vanity.add(mirrorSurface);
    this.group.add(vanity);
    this.addCollider(-5.5, -4.8, 3.6, 5.5, 1.6, 3.0);

    // Mirror reflection figure
    this.mirrorGhostMesh = this.buildSilhouetteMesh(0.82);
    this.mirrorGhostMesh.position.set(-4.65, 3.68, 2.3);
    this.mirrorGhostMesh.rotation.y = Math.PI / 2;
    this.mirrorGhostMesh.visible = false;
    this.group.add(this.mirrorGhostMesh);

    // Bedroom Desk with Locked Drawer
    const desk = new THREE.Group();
    desk.position.set(-1.6, 3.64, 4.85);
    desk.add(this.makeBox(1.6, 0.76, 0.75, wornWoodMat, 0, 0.38, 0, true));
    const paperMat = this.trackMat(new THREE.MeshStandardMaterial({ color: 0xbcb4a0, roughness: 0.9 }));
    desk.add(this.makeBox(0.24, 0.01, 0.32, paperMat, -0.3, 0.77, -0.05));
    const p2 = this.makeBox(0.22, 0.01, 0.28, paperMat, 0.15, 0.77, 0.08);
    p2.rotation.y = 0.45;
    desk.add(p2);
    this.group.add(desk);
    this.addCollider(-2.45, -0.75, 3.6, 4.6, 4.4, 5.3);
    this.addInteractive(
      'bedroom_drawer',
      'OPEN LOCKED DRAWER',
      'Bedroom',
      desk,
      new THREE.Vector3(-1.6, 4.19, 4.85),
      [1.4, 0.75, 0.75],
      2.5
    );
  }

  private buildBasementAndStairs(
    concreteMat: THREE.Material,
    darkWoodMat: THREE.Material,
    wornWoodMat: THREE.Material,
    ironMat: THREE.Material,
    brassMat: THREE.Material
  ): void {
    // Basement Staircase (X: 2.46..3.78, Z: -4.65 -> -9.75, Y: 0.0 -> -3.4)
    // Strictly non-overlapping steps & solid sloped base
    const steps = 14;
    const zStart = -4.65;
    const zEnd = -9.75;
    const stepD = (zStart - zEnd) / steps;
    const stepH = 3.4 / steps;
    for (let i = 0; i < steps; i++) {
      const sz = zStart - (i + 0.5) * stepD;
      const topY = -i * stepH;
      const sy = topY - stepH * 0.5;
      this.group.add(
        this.makeBox(1.32, stepH - 0.002, stepD - 0.002, wornWoodMat, 3.12, sy, sz)
      );
    }

    // Sloped concrete base under basement stairs
    const bRun = zStart - zEnd;
    const bLen = Math.hypot(bRun, 3.4);
    const bSoffit = this.makeBox(1.32, 0.22, bLen, concreteMat, 3.12, -1.9, -7.2);
    bSoffit.rotation.x = -Math.atan2(3.4, bRun);
    this.group.add(bSoffit);

    // Stairwell walls & properly sloped stairwell ceiling (from Y=2.6 at Z=-4.6 down to Y=-0.1 at Z=-9.8)
    this.group.add(this.makeBox(0.2, 6.4, 5.2, concreteMat, 2.32, -0.4, -7.2));
    this.group.add(this.makeBox(0.2, 6.4, 5.2, concreteMat, 3.92, -0.4, -7.2));
    const bCeilLen = Math.hypot(5.2, 2.7);
    const bCeil = this.makeBox(1.8, 0.2, bCeilLen, concreteMat, 3.12, 1.32, -7.2);
    bCeil.rotation.x = -Math.atan2(2.7, 5.2);
    this.group.add(bCeil);
    this.addCollider(2.15, 2.42, -3.5, 2.8, -9.85, -4.5);
    this.addCollider(3.82, 4.1, -3.5, 2.8, -9.85, -4.5);

    // Basement Main Room (X: -5.5..4.55, Z: -9.8..-18.25, Y = -3.4)
    this.group.add(this.makeBox(10.4, 0.2, 8.6, concreteMat, -0.5, -3.5, -14.05));
    // Basement Ceiling strictly over Z: -18.35..-9.75 (never overlaps stairwell or ground floor)
    this.group.add(this.makeBox(10.4, 0.2, 8.6, concreteMat, -0.5, -0.12, -14.05));

    // North Wall
    this.group.add(this.makeBox(10.4, 3.3, 0.2, concreteMat, -0.5, -1.75, -18.25));
    this.addCollider(-5.6, 4.6, -3.5, 0.0, -18.4, -18.1);

    // South Wall (Z = -9.8) leaving stairwell gap X: 2.4..3.85
    this.group.add(this.makeBox(7.95, 3.3, 0.2, concreteMat, -1.58, -1.75, -9.8));
    this.group.add(this.makeBox(0.8, 3.3, 0.2, concreteMat, 4.25, -1.75, -9.8));
    this.addCollider(-5.6, 2.42, -3.5, 0.0, -9.92, -9.68);
    this.addCollider(3.82, 4.6, -3.5, 0.0, -9.92, -9.68);

    // East Wall
    this.group.add(this.makeBox(0.2, 3.3, 8.6, concreteMat, 4.55, -1.75, -14.05));
    this.addCollider(4.42, 4.7, -3.5, 0.0, -18.4, -9.7);

    // West Wall with Hidden Compartment opening at Z: -15.4..-17.0
    this.group.add(this.makeBox(0.2, 3.3, 5.6, concreteMat, -5.5, -1.75, -12.6));
    this.group.add(this.makeBox(0.2, 3.3, 1.3, concreteMat, -5.5, -1.75, -17.65));
    this.group.add(this.makeBox(0.2, 0.9, 1.6, concreteMat, -5.5, -0.65, -16.2));
    this.addCollider(-5.65, -5.38, -3.5, 0.0, -15.4, -9.7);
    this.addCollider(-5.65, -5.38, -3.5, 0.0, -18.3, -17.0);

    // Hidden Basement Compartment
    this.group.add(this.makeBox(2.6, 0.2, 2.4, concreteMat, -6.9, -3.5, -16.2));
    this.group.add(this.makeBox(2.6, 0.2, 2.4, concreteMat, -6.9, -0.8, -16.2));
    this.group.add(this.makeBox(0.2, 2.7, 2.4, concreteMat, -8.1, -2.15, -16.2));
    this.group.add(this.makeBox(2.6, 2.7, 0.2, concreteMat, -6.9, -2.15, -15.1));
    this.group.add(this.makeBox(2.6, 2.7, 0.2, concreteMat, -6.9, -2.15, -17.3));
    this.addCollider(-8.2, -7.95, -3.5, 0, -17.4, -15.0);
    this.addCollider(-8.1, -5.4, -3.5, 0, -15.22, -15.0);
    this.addCollider(-8.1, -5.4, -3.5, 0, -17.4, -17.18);

    // Hidden Compartment Sliding Wall Panel
    this.hiddenPanelMesh = this.makeBox(0.14, 2.35, 1.6, darkWoodMat, -5.45, -2.22, -16.2, true);
    this.group.add(this.hiddenPanelMesh);
    this.hiddenPanelCollider = this.addCollider(-5.62, -5.35, -3.5, -0.5, -17.0, -15.4, 'hidden_panel');

    // Pedestal & Secret Discovery inside Hidden Compartment
    const altar = new THREE.Group();
    altar.position.set(-7.1, -3.4, -16.2);
    altar.add(this.makeBox(0.65, 0.9, 0.85, darkWoodMat, 0, 0.45, 0));
    const locket = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.025, 16)),
      brassMat
    );
    locket.position.set(0, 0.92, 0.05);
    const tape2 = this.makeBox(0.14, 0.025, 0.09, ironMat, 0.04, 0.92, -0.15);
    altar.add(locket, tape2);
    this.group.add(altar);
    this.addCollider(-7.5, -6.7, -3.4, -2.2, -16.65, -15.75);
    this.addInteractive(
      'hidden_compartment_item',
      'INSPECT HIDDEN RELICS',
      'Hidden Compartment',
      altar,
      new THREE.Vector3(-7.1, -2.45, -16.2),
      [0.75, 0.8, 0.95],
      2.6
    );

    // Basement Puzzle Mechanism on West Wall
    const mechGroup = new THREE.Group();
    mechGroup.position.set(-5.34, -1.85, -14.2);
    mechGroup.add(this.makeBox(0.14, 0.9, 0.72, darkWoodMat, 0, 0, 0));
    const brassClockRing = new THREE.Mesh(
      this.trackGeo(new THREE.TorusGeometry(0.12, 0.018, 10, 20)),
      brassMat
    );
    brassClockRing.rotation.y = Math.PI / 2;
    brassClockRing.position.set(0.085, 0.2, -0.14);
    const symbolWheel = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 16)),
      ironMat
    );
    symbolWheel.rotation.z = Math.PI / 2;
    symbolWheel.position.set(0.085, 0.2, 0.16);
    const knockPlate = this.makeBox(0.04, 0.28, 0.48, wornWoodMat, 0.08, -0.18, 0);
    mechGroup.add(brassClockRing, symbolWheel, knockPlate);
    this.group.add(mechGroup);
    this.addInteractive(
      'basement_mechanism',
      'EXAMINE MECHANISM',
      'Basement',
      mechGroup,
      new THREE.Vector3(-5.28, -1.85, -14.2),
      [0.45, 1.0, 0.85],
      2.6
    );

    // Dusty Table + Old Recording Device
    const bTable = new THREE.Group();
    bTable.position.set(-1.2, -3.4, -13.5);
    bTable.add(this.makeBox(1.5, 0.07, 0.85, wornWoodMat, 0, 0.78, 0));
    [
      [-0.65, -0.35],
      [0.65, -0.35],
      [-0.65, 0.35],
      [0.65, 0.35],
    ].forEach(([lx, lz]) => {
      bTable.add(this.makeBox(0.08, 0.74, 0.08, darkWoodMat, lx, 0.37, lz));
    });
    const recorder = new THREE.Group();
    recorder.position.set(0.1, 0.82, 0.05);
    recorder.add(this.makeBox(0.42, 0.11, 0.3, ironMat, 0, 0.055, 0));
    const reelGeo = this.trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.02, 14));
    const reel1 = new THREE.Mesh(reelGeo, brassMat);
    reel1.position.set(-0.1, 0.125, -0.02);
    const reel2 = new THREE.Mesh(reelGeo, brassMat);
    reel2.position.set(0.1, 0.125, -0.02);
    this.recordingReels.push(reel1, reel2);
    recorder.add(reel1, reel2);
    bTable.add(recorder);
    this.group.add(bTable);
    this.addCollider(-2.0, -0.4, -3.4, -2.3, -13.95, -13.05);
    this.addInteractive(
      'old_recorder',
      'PLAY RECORDING',
      'Basement',
      recorder,
      new THREE.Vector3(-1.1, -2.52, -13.45),
      [0.7, 0.45, 0.6],
      2.6
    );

    // Exposed Pipes
    const pipe1 = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.05, 0.05, 8.2, 8)),
      ironMat
    );
    pipe1.rotation.x = Math.PI / 2;
    pipe1.position.set(-2.5, -0.35, -14.0);
    const pipe2 = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 9.6, 8)),
      ironMat
    );
    pipe2.rotation.z = Math.PI / 2;
    pipe2.position.set(-0.5, -0.44, -15.5);
    this.group.add(pipe1, pipe2);

    // Water drips
    const dropGeo = this.trackGeo(new THREE.SphereGeometry(0.022, 6, 6));
    const dropMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x7ea5c4, roughness: 0.1, transparent: true, opacity: 0.7 })
    );
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(dropGeo, dropMat);
      m.position.set(-2.5, -0.4 - i * 0.9, -15.5 + i * 0.8);
      this.group.add(m);
      this.waterDripParticles.push({ mesh: m, y: m.position.y, speed: 2.8 + i * 0.4 });
    }

    // Hanging Basement Bulb
    const cord = this.makeBox(0.02, 0.75, 0.02, ironMat, -1.0, -0.58, -13.5);
    const bulb = new THREE.Mesh(
      this.trackGeo(new THREE.SphereGeometry(0.06, 10, 10)),
      this.trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffe4b5,
          emissive: 0xd9a85b,
          emissiveIntensity: 1.5,
        })
      )
    );
    bulb.position.set(-1.0, -0.96, -13.5);
    this.group.add(cord, bulb);

    // Storage Crates & Shelves
    this.group.add(this.makeBox(0.9, 0.85, 0.9, wornWoodMat, 3.4, -2.97, -12.4));
    this.group.add(this.makeBox(0.75, 0.7, 0.75, darkWoodMat, 3.2, -3.05, -13.5));
    this.group.add(this.makeBox(0.65, 0.65, 0.65, wornWoodMat, 3.3, -2.21, -12.4));
    this.addCollider(2.75, 4.0, -3.4, -1.5, -14.0, -11.9);

    const shelf = new THREE.Group();
    shelf.position.set(2.4, -3.4, -17.6);
    shelf.add(this.makeBox(2.2, 2.0, 0.55, darkWoodMat, 0, 1.0, 0));
    this.group.add(shelf);
    this.addCollider(1.25, 3.55, -3.4, -1.2, -17.95, -17.25);

    this.group.add(this.makeBox(0.14, 0.65, 0.48, ironMat, 4.38, -1.8, -11.4));

    // Chalk markings decal on Basement floor (1.5cm above floor + polygonOffset)
    const decalMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        map: this.textures.basementMarkings,
        transparent: true,
        opacity: 0.75,
        roughness: 0.95,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    const decal = new THREE.Mesh(this.trackGeo(new THREE.PlaneGeometry(1.8, 1.8)), decalMat);
    decal.rotation.x = -Math.PI / 2;
    decal.position.set(-3.4, -3.38, -15.4);
    this.group.add(decal);
  }

  private buildSilhouetteMesh(scale = 1): THREE.Group {
    const g = new THREE.Group();
    const shadowMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x050507,
        roughness: 0.95,
        metalness: 0.05,
        transparent: true,
        opacity: 0.92,
      })
    );
    const torso = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.16 * scale, 0.13 * scale, 1.1 * scale, 10)),
      shadowMat
    );
    torso.position.y = 1.48 * scale;

    const head = new THREE.Mesh(
      this.trackGeo(new THREE.SphereGeometry(0.125 * scale, 12, 12)),
      shadowMat
    );
    head.scale.set(0.85, 1.25, 0.9);
    head.position.y = 2.18 * scale;

    const armL = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.042 * scale, 0.032 * scale, 1.05 * scale, 8)),
      shadowMat
    );
    armL.position.set(-0.23 * scale, 1.35 * scale, 0);
    armL.rotation.z = 0.08;

    const armR = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.042 * scale, 0.032 * scale, 1.05 * scale, 8)),
      shadowMat
    );
    armR.position.set(0.23 * scale, 1.35 * scale, 0);
    armR.rotation.z = -0.08;

    const legL = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.06 * scale, 0.04 * scale, 1.0 * scale, 8)),
      shadowMat
    );
    legL.position.set(-0.08 * scale, 0.5 * scale, 0);

    const legR = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.06 * scale, 0.04 * scale, 1.0 * scale, 8)),
      shadowMat
    );
    legR.position.set(0.08 * scale, 0.5 * scale, 0);

    g.add(torso, head, armL, armR, legL, legR);
    return g;
  }

  private buildEntityAndAtmosphere(): void {
    this.entitySilhouette = this.buildSilhouetteMesh(1.08);
    this.entitySilhouette.visible = false;
    this.group.add(this.entitySilhouette);

    const count = 240;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = -3.0 + Math.random() * 9.5;
      positions[i * 3 + 2] = -17.5 + Math.random() * 22.5;
    }
    const dustGeo = this.trackGeo(new THREE.BufferGeometry());
    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dustMat = this.trackMat(
      new THREE.PointsMaterial({
        color: 0x9aa4b2,
        size: 0.028,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      })
    );
    this.dustParticles = new THREE.Points(dustGeo, dustMat);
    this.group.add(this.dustParticles);
  }

  public setFrontDoorLocked(locked: boolean): void {
    this.frontDoorCollider.maxY = locked ? 2.6 : -10;
  }

  public openBasementDoor(): void {
    this.basementDoorTargetAngle = -Math.PI * 0.52;
    this.basementDoorCollider.maxY = -10;
  }

  public openHiddenCompartment(): void {
    this.hiddenPanelTargetOffset = 1.65;
    this.hiddenPanelCollider.maxY = -10;
  }

  public triggerLivingRoomShift(): void {
    this.shiftChairGroup.position.set(0.75, 0, -2.55);
    this.shiftChairGroup.rotation.y = -0.85;
  }

  public getFloorHeightAt(x: number, z: number, currentFootY: number): number {
    // Exterior porch & steps
    if (z >= 5.6 && z <= 7.72 && Math.abs(x) <= 2.35) {
      return 0.14;
    }
    if (z > 7.72 && z <= 8.25 && Math.abs(x) <= 1.35) {
      return THREE.MathUtils.clamp((8.25 - z) / 0.53, 0, 1) * 0.14;
    }
    if (z > 5.6) {
      return -0.02;
    }

    // Basement Staircase (X: 2.32..3.92, Z: -9.8..-4.55)
    if (x >= 2.32 && x <= 3.92 && z <= -4.55 && z >= -9.8 && currentFootY < 1.2) {
      const t = THREE.MathUtils.clamp((-4.65 - z) / (-4.65 - (-9.75)), 0, 1);
      return -t * 3.4;
    }

    // Basement & Hidden Compartment
    if (z < -9.8) {
      return -3.4;
    }

    // Upstairs Staircase (X: 4.05..5.65, Z: -1.3..4.15)
    if (x >= 4.05 && x <= 5.65 && z >= -1.3 && z <= 4.15) {
      const t = THREE.MathUtils.clamp((3.8 - z) / (3.8 - (-1.2)), 0, 1);
      return t * 3.64;
    }

    // Upstairs Floor
    if (currentFootY >= 2.1) {
      return 3.64;
    }

    // Ground floor
    return 0.0;
  }

  public update(delta: number, elapsed: number): void {
    this.frontDoorAngle = THREE.MathUtils.damp(this.frontDoorAngle, this.frontDoorTargetAngle, 9, delta);
    this.frontDoorPivot.rotation.y = this.frontDoorAngle;

    this.basementDoorAngle = THREE.MathUtils.damp(this.basementDoorAngle, this.basementDoorTargetAngle, 5.5, delta);
    this.basementDoorPivot.rotation.y = this.basementDoorAngle;

    this.hiddenPanelOffset = THREE.MathUtils.damp(this.hiddenPanelOffset, this.hiddenPanelTargetOffset, 4.0, delta);
    this.hiddenPanelMesh.position.z = -16.2 + this.hiddenPanelOffset;

    if (this.recordingSpinning) {
      this.recordingReels.forEach((r) => {
        r.rotation.y += delta * 4.5;
      });
    }

    this.curtains.forEach((c, idx) => {
      c.rotation.z = Math.sin(elapsed * 1.1 + idx) * 0.035;
    });

    if (this.reducedEffects) {
      this.livingLampLight.intensity = Math.max(0.55, 1.75 - this.flickerIntensity * 0.8);
      this.basementBulbLight.intensity = Math.max(0.45, 0.92 - this.flickerIntensity * 0.4);
    } else {
      const baseLamp = 1.75 + Math.sin(elapsed * 4.3) * 0.08 + Math.sin(elapsed * 19.0) * 0.04;
      this.livingLampLight.intensity = Math.max(0.25, baseLamp - this.flickerIntensity * 1.3);

      const bNoise = Math.sin(elapsed * 11.3) * Math.sin(elapsed * 27.1);
      const bBase = bNoise > 0.72 ? 0.35 : 0.95;
      this.basementBulbLight.intensity = Math.max(0.12, bBase - this.flickerIntensity * 0.85);
    }

    this.waterDripParticles.forEach((p) => {
      p.y -= p.speed * delta;
      if (p.y < -3.38) {
        p.y = -0.4;
      }
      p.mesh.position.y = p.y;
    });

    this.dustParticles.rotation.y = elapsed * 0.015;
  }

  public dispose(): void {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
  }
}
