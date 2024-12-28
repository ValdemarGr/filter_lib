import { SCHEMA_URL, SCHEMA_VERSION } from 'pathofexile-dat-schema';
import { readDatFile } from './vendor/poedat/dat/dat-file.js';
import * as loaders from './vendor/poedat/cli/bundle-loaders.js';
import * as fs from 'fs/promises'
import * as path from 'path'
import * as exportTables from './vendor/poedat/cli/export-tables.js';

const cacheDir = (patch: string) => path.join(process.cwd(), '/cache', `/${patch}`)

const tblDir = (patch: string) => path.join(cacheDir(patch), 'tables');

const isPoe2 = (patch: string) => patch.startsWith('4.');

export async function singleImport(name: string, patch: string) {
  const cd = cacheDir(patch);

  await fs.mkdir(cd, { recursive: true })

  const loader: loaders.FileLoader = await loaders.FileLoader.create(
    await loaders.CdnBundleLoader.create(path.join(cd, '/cdn'), patch)
  )

  const schema = await (await fetch(SCHEMA_URL)).json();
  // if (schema.version !== SCHEMA_VERSION) {
  //   console.error('Schema has format not compatible with this package. Check for "pathofexile-dat" updates.', schema.version, SCHEMA_VERSION);
  //   process.exit(1);
  // }
  console.log(`Exporting table "Data/${name}"`);
  const datFile = readDatFile('.datc64', await loader.tryGetFileContents(`Data/${name}.datc64`) ??
    await loader.getFileContents(`Data/${name}.datc64`));
  const headers = exportTables.importHeaders(name, datFile, { patch: patch }, schema);
  const tblPath = tblDir(patch);
  fs.mkdir(tblPath, { recursive: true });
  const output = path.join(tblPath, `${name}.json`);
  await fs.writeFile(
    output,
    JSON.stringify(exportTables.exportAllRows(headers, datFile), null, 2)
  );
  return output;
}

const BaseItemTypes = "BaseItemTypes";
const ArmourTypes = "ArmourTypes";
const WeaponTypes = "WeaponTypes";
const ShieldTypes = "ShieldTypes";
const ComponentAttributeRequirements = "ComponentAttributeRequirements";
const ItemClasses = "ItemClasses";
const AttributeRequirements = "AttributeRequirements";

type Poe1FileNames = [
  typeof BaseItemTypes,
  typeof ArmourTypes,
  typeof WeaponTypes,
  typeof ShieldTypes,
  typeof ComponentAttributeRequirements,
  typeof ItemClasses
]

type Poe1FileNamesT = Poe1FileNames[number]

const Poe1FileNames: Poe1FileNames = [
  BaseItemTypes,
  ArmourTypes,
  WeaponTypes,
  ShieldTypes,
  ComponentAttributeRequirements,
  ItemClasses
]

type Poe2FileNames = [
  typeof BaseItemTypes,
  typeof ArmourTypes,
  typeof WeaponTypes,
  typeof ShieldTypes,
  typeof ItemClasses,
  typeof AttributeRequirements
]

type Poe2FileNamesT = Poe2FileNames[number]

const Poe2FileNames: Poe2FileNames = [
  BaseItemTypes,
  ArmourTypes,
  WeaponTypes,
  ShieldTypes,
  ItemClasses,
  AttributeRequirements
]

export async function importData<K extends string>(files: K[], patch: string): Promise<Record<K, string>> {
  const imported = await Promise.all(files.map(async k => [k, await singleImport(k, patch)]))
  return Object.fromEntries(imported)
}

export async function importPoe1Data(patch: string): Promise<Record<Poe1FileNamesT, string>> {
  return await importData(Poe1FileNames, patch);
}

export async function importPoe2Data(patch: string): Promise<Record<Poe2FileNamesT, string>> {
  return await importData(Poe2FileNames, patch);
}

export async function readFiles<K extends string>(
  files: Record<K, string>
): Promise<Record<K, any[]>> {
  const es = Object.entries<string>(files)
  const m = await Promise.all(es.map(async ([k, v]) => [k, await read(v)]))
  return Object.fromEntries(m) as Record<K, any[]>
}

export type UnifiedItem = {
  baseItem: {
    Id: string,
    Name: string,
    DropLevel: number
  },
  itemClass: {
    Id: string,
    name: string
  },
  attributeRequirements?: {
    str: number,
    dex: number,
    int: number
  },
  shieldInfo?: {
    block: number
  },
  weaponInfo?: {
    crit: number,
    speed: number,
    aps: number,
    min: number,
    max: number
    rng: number
  },
  armourInfo?: {
    armourMin: number,
    armourMax: number,
    evasionMin: number,
    evasionMax: number,
    energyShieldMin: number,
    energyShieldMax: number
    movementSpeed: number,
    wardMin: number,
    wardMax: number
  }
}

async function read(file: string): Promise<any[]> {
  return JSON.parse(await fs.readFile(file, { encoding: 'utf-8' })) as any[]
}

function toMap(vs: any[], f: (x: any) => any): Record<any, any> {
  return Object.fromEntries(vs.map(v => [f(v), v]))
}

type AmigiousKey = Poe1FileNames | Poe2FileNames;

export async function generateExportedItems(patch: string): Promise<UnifiedItem[]> {
  const rf = isPoe2(patch) ? await readFiles(await importPoe2Data(patch)) : await readFiles(await importPoe1Data(patch));
  const icMap = toMap(rf.ItemClasses, x => x["_index"]);
  const arMap = toMap(rf.ArmourTypes, x => x.BaseItemTypesKey);
  const wtMap = toMap(rf.WeaponTypes, x => x.BaseItemTypesKey);
  const stMap = toMap(rf.ShieldTypes, x => x.BaseItemTypesKey);
  const carMap = "ComponentAttributeRequirements" in rf ? toMap(rf.ComponentAttributeRequirements, x => x.BaseItemTypesKey) :
    toMap(rf.AttributeRequirements, x => x.BaseItemTypesKey);
  return rf.BaseItemTypes.map(b => {
    const ic = icMap[b.ItemClass] ?? icMap[b.ItemClassesKey];
    const ar = arMap[b["_index"]];
    const wt = wtMap[b["_index"]];
    const st = stMap[b["_index"]];
    const car = carMap[b.Id];
    return {
      baseItem: {
        Id: b.Id,
        Name: b.Name,
        DropLevel: b.DropLevel
      },
      itemClass: {
        Id: ic.Id,
        name: ic.Name
      },
      attributeRequirements: car ? {
        str: car.ReqStr,
        dex: car.ReqDex,
        int: car.ReqInt
      } : undefined,
      shieldInfo: st ? {
        block: st.Block
      } : undefined,
      weaponInfo: wt ? {
        crit: wt.Critical,
        speed: wt.Speed,
        aps: Math.round(((1 / wt.Speed) * 1000) * 100) / 100,
        min: wt.DamageMin,
        max: wt.DamageMax,
        rng: wt.RangeMax
      } : undefined,
      armourInfo: ar ? {
        armourMin: ar.ArmourMin ?? ar.Armour,
        armourMax: ar.ArmourMax ?? ar.Armour,
        evasionMin: ar.EvasionMin ?? ar.Evasion,
        evasionMax: ar.EvasionMax ?? ar.Evasion,
        energyShieldMin: ar.EnergyShieldMin ?? ar.EnergyShield,
        energyShieldMax: ar.EnergyShieldMax ?? ar.EnergyShield,
        movementSpeed: ar.IncreasedMovementSpeed,
        wardMin: ar.WardMin ?? ar.Ward,
        wardMax: ar.WardMax ?? ar.Ward
      } : undefined
    }
  })
}
