import * as fs from 'fs';
import * as importer from './importer.js';

type Operator = "=" | "!" | "<" | "<=" | ">" | ">=";

type Value = string | "None" | number | null;

type EquipmentRarity = "Normal" | "Magic" | "Rare" | "Unique"

type RGBA = [number, number, number, number | null];

type StandardColor = "Red" | "Green" | "Blue" | "Brown" | "White" | "Yellow" | "Orange" | "Purple" | "Cyan" | "Gray" | "Black" | "Pink"

type Conditions = {
  areaLevel?: [Operator, number[]];
  itemLevel?: [Operator, number[]];
  dropLevel?: [Operator, number[]];
  quality?: [Operator, number[]];
  rarity?: [Operator, EquipmentRarity[]];
  class?: [Operator, string[]];
  baseType?: [Operator, string[]];
  prophecy?: string[];
  linkedSockets?: [Operator, number[]];
  socketGroup?: [Operator, string[]];
  sockets?: [Operator, number[]];
  height?: [Operator, number[]];
  width?: [Operator, number[]];
  hasExplicitMod?: [Operator, string[]];
  anyEnchantment?: boolean;
  hasEnchantment?: string;
  enchantmentPassiveNode?: string;
  enchantmentPassiveNum?: [Operator, number[]];
  stackSize?: [Operator, number[]];
  gemLevel?: [Operator, number[]];
  gemQualityType?: "Superior" | "Anomalous" | "Divergent" | "Phantasmal";
  alternateQuality?: boolean;
  replica?: boolean;
  identified?: boolean;
  corrupted?: boolean;
  corruptedMods?: [Operator, number[]];
  mirrored?: boolean;
  elderItem?: boolean;
  shaperItem?: boolean;
  hasInfluence?: "Shaper" | "Elder" | "Crusader" | "Hunter" | "Redeemer" | "Warlord";
  hasSearingExarchImplicit?: [Operator, number[]];
  hasEaterOfWorldsImplicit?: [Operator, number[]];
  fracturedItem?: boolean;
  synthesisedItem?: boolean;
  elderMap?: boolean;
  shaperMap?: boolean;
  blightedMap?: boolean;
  mapTier?: [Operator, number[]];
  hasImplicitMod?: boolean;
  hasCruciblePassiveTree?: boolean;
};

type Actions = {
  setBorderColor?: RGBA;
  setTextColor?: RGBA;
  setBackgroundColor?: RGBA;
  setFontSize?: number;
  playAlertSound?: ["None" | number, number];
  playAlertSoundPositional?: ["None" | number, number];
  disableDropSound?: boolean;
  enableDropSound?: boolean;
  customAlertSound?: string;
  minimapIcon?: [
    0 | 1 | 2,
    StandardColor,
    "Circle" | "Diamond" | "Hexagon" | "Square" | "Star" | "Triangle" | "Cross" | "Moon" | "Raindrop" | "Kite" | "Pentagon" | "UpsideDownHouse"
  ],
  playEffect?: [StandardColor, "" | "Temp"]
};

type BlockType = "Show" | "Hide" | "Continue"

type Rule = {
  blockType: BlockType;
  conditions?: Conditions;
  actions?: Actions;
};

function renderValue(b: (number | string | boolean | null)): string {
  if (typeof b === "boolean") {
    return b ? "True" : "False";
  } else if (b === null) {
    return "";
  } else if (typeof b === "number") {
    return b.toString();
  } else {
    return "\"" + b + "\"";
  }
}

function renderValues(values: (number | string | boolean | null)[]): string {
  return values.map(x => renderValue(x)).join(" ");
}

function renderBinaryOperator(operator: Operator, values: (number | string | boolean | null)[]): string {
  const res = `${operator} ${renderValues(values)}`;
  return res;
}

function renderBinaryTuple(t: [Operator, (number | string | boolean | null)[]]): string {
  if (!t) return null;
  return renderBinaryOperator(t[0], t[1]);
}

function map<A, B>(fa: A | null | undefined, f: (a: A) => B): B | null {
  if (fa == null || fa == undefined) return null;
  return f(fa);
}

function render(rules: Rule[]) {
  const renderedRules: string[] = rules.map((rule) => {
    const c = rule.conditions;
    const a = rule.actions;
    const parts: [string | null, string | null][] = [
      [null, rule.blockType],

      ["AreaLevel", map(c?.areaLevel, renderBinaryTuple)],
      ["ItemLevel", map(c?.itemLevel, renderBinaryTuple)],
      ["DropLevel", map(c?.dropLevel, renderBinaryTuple)],
      ["Quality", map(c?.quality, renderBinaryTuple)],
      ["Rarity", map(c?.rarity, renderBinaryTuple)],
      ["Class", map(c?.class, renderBinaryTuple)],
      ["BaseType", map(c?.baseType, renderBinaryTuple)],
      ["Prophecy", map(c?.prophecy, renderValues)],
      ["LinkedSockets", map(c?.linkedSockets, renderBinaryTuple)],
      ["SocketGroup", map(c?.socketGroup, renderBinaryTuple)],
      ["Sockets", map(c?.sockets, renderBinaryTuple)],
      ["Height", map(c?.height, renderBinaryTuple)],
      ["Width", map(c?.width, renderBinaryTuple)],
      ["HasExplicitMod", map(c?.hasExplicitMod, renderBinaryTuple)],
      ["AnyEnchantment", map(c?.anyEnchantment, renderValue)],
      ["HasEnchantment", c?.hasEnchantment ?? null],
      ["EnchantmentPassiveNode", c?.enchantmentPassiveNode ?? null],
      ["EnchantmentPassiveNum", map(c?.enchantmentPassiveNum, renderBinaryTuple)],
      ["StackSize", map(c?.stackSize, renderBinaryTuple)],
      ["GemLevel", map(c?.gemLevel, renderBinaryTuple)],
      ["GemQualityType", c?.gemQualityType],
      ["AlternateQuality", map(c?.alternateQuality, renderValue)],
      ["Replica", map(c?.replica, renderValue)],
      ["Identified", map(c?.identified, renderValue)],
      ["Corrupted", map(c?.corrupted, renderValue)],
      ["CorruptedMods", map(c?.corruptedMods, renderBinaryTuple)],
      ["Mirrored", map(c?.mirrored, renderValue)],
      ["ElderItem", map(c?.elderItem, renderValue)],
      ["ShaperItem", map(c?.shaperItem, renderValue)],
      ["HasInfluence", map(c?.hasInfluence, renderValue)],
      ["HasSearingExarchImplicit", map(c?.hasSearingExarchImplicit, renderBinaryTuple)],
      ["HasEaterOfWorldsImplicit", map(c?.hasEaterOfWorldsImplicit, renderBinaryTuple)],
      ["FracturedItem", map(c?.fracturedItem, renderValue)],
      ["SynthesisedItem", map(c?.synthesisedItem, renderValue)],
      ["ElderMap", map(c?.elderMap, renderValue)],
      ["ShaperMap", map(c?.shaperMap, renderValue)],
      ["BlightedMap", map(c?.blightedMap, renderValue)],
      ["MapTier", map(c?.mapTier, renderBinaryTuple)],
      ["HasImplicitMod", map(c?.hasImplicitMod, renderValue)],
      ["HasCruciblePassiveTree", map(c?.hasCruciblePassiveTree, renderValue)],

      ["SetBorderColor", map(a?.setBorderColor, renderValues)],
      ["SetTextColor", map(a?.setTextColor, renderValues)],
      ["SetBackgroundColor", map(a?.setBackgroundColor, renderValues)],
      ["SetFontSize", map(a?.setFontSize, renderValue)],
      ["PlayAlertSound", map(a?.playAlertSound, renderValues)],
      ["PlayAlertSoundPositional", map(a?.playAlertSoundPositional, renderValues)],
      ["DisableDropSound", map(a?.disableDropSound, renderValue)],
      ["EnableDropSound", map(a?.enableDropSound, renderValue)],
      ["CustomAlertSound", map(a?.customAlertSound, renderValue)],
      ["MinimapIcon", map(a?.minimapIcon, renderValues)],
      ["PlayEffect", map(a?.playEffect, renderValues)],
    ];
    return parts.filter((x) => x[1] != null).map(x => `${x[0] === null ? "" : (x[0] + " ")}${x[1]}`).join("\n");
  });

  return renderedRules.join("\n\n");
};

// console.log(render([
//   {
//     blockType: "Show",
//     conditions: {
//       areaLevel: ["<=", [68, 69]],
//       itemLevel: [">=", [75]],
//       rarity: ["=", ["Rare"]],
//       class: ["=", ["Bow"]],
//       baseType: ["=", ["Crude Bow"]],
//       quality: [">=", [10]],
//       hasExplicitMod: ["=", ["(20-24)% increased Elemental Damage with Attack Skills"]],
//       anyEnchantment: true,
//       hasEnchantment: "Adds 1 to 2 Fire Damage if you've Killed Recently",
//       stackSize: [">=", [10]],
//       gemLevel: [">=", [20]],
//       gemQualityType: "Superior",
//       alternateQuality: true,
//       replica: true,
//       identified: true,
//       corrupted: true,
//       corruptedMods: [">=", [1]],
//       mirrored: true,
//       elderItem: true,
//       shaperItem: true,
//       hasInfluence: "Shaper",
//       hasSearingExarchImplicit: [">=", [1]],
//       hasEaterOfWorldsImplicit: [">=", [1]],
//       fracturedItem: true,
//       synthesisedItem: true,
//       elderMap: true,
//       shaperMap: true,
//       blightedMap: true,
//       mapTier: [">=", [10]],
//       hasImplicitMod: true,
//       hasCruciblePassiveTree: true,
//     }
//   }
// ]));

type Stats = {
  str?: number;
  dex?: number;
  int?: number;
}

type Bow = {
  name: string;
  physicalDamage: [number, number];
  critChance: number;
  aps: number;
  requiredLevel: number;
  requiredStats: Stats;
};

const bows = [
  {
    name: "Crude Bow",
    physicalDamage: [6, 9],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 1,
    requiredStats: {}
  }, {
    name: "Shortbow",
    physicalDamage: [7, 14],
    critChance: 5,
    aps: 1.25,
    requiredLevel: 5,
    requiredStats: { dex: 14 }

  }, {
    name: "Warden Bow",
    physicalDamage: [12, 18],
    critChance: 5,
    aps: 1.15,
    requiredLevel: 11,
    requiredStats: { dex: 27 }

  }, {
    name: "Recurve Bow",
    physicalDamage: [15, 31],
    critChance: 5,
    aps: 1.1,
    requiredLevel: 16,
    requiredStats: { dex: 38 }

  }, {
    name: "Composite Bow",
    physicalDamage: [19, 31],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 22,
    requiredStats: { dex: 52 }

  }, {
    name: "Dualstring Bow",
    physicalDamage: [16, 31],
    critChance: 5,
    aps: 1.1,
    requiredLevel: 28,
    requiredStats: { dex: 65 }

  }, {
    name: "Cultist Bow",
    physicalDamage: [36, 59],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 33,
    requiredStats: { dex: 76 }

  }, {
    name: "Zealot Bow",
    physicalDamage: [31, 47],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 39,
    requiredStats: { dex: 90 }

  }, {
    name: "Artillery Bow",
    physicalDamage: [39, 72],
    critChance: 5,
    aps: 1.15,
    requiredLevel: 45,
    requiredStats: { dex: 104 }

  }, {
    name: "Tribal Bow",
    physicalDamage: [38, 57],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 50,
    requiredStats: { dex: 115 }

  }, {
    name: "Greatbow",
    physicalDamage: [40, 82],
    critChance: 6.5,
    aps: 1.15,
    requiredLevel: 52,
    requiredStats: { dex: 119, str: 119 }

  }, {
    name: "Double Limb Bow",
    physicalDamage: [42, 63],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 56,
    requiredStats: { dex: 128 }

  }, {
    name: "Heavy Bow",
    physicalDamage: [45, 75],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 65,
    requiredStats: { dex: 148 }

  }, {
    name: "Advanced Shortbow",
    physicalDamage: [29, 54],
    critChance: 5,
    aps: 1.25,
    requiredLevel: 45,
    requiredStats: { dex: 104 }

  }, {
    name: "Advanced Warden Bow",
    physicalDamage: [35, 53],
    critChance: 5,
    aps: 1.15,
    requiredLevel: 48,
    requiredStats: { dex: 110 }

  }, {
    name: "Advanced Composite Bow",
    physicalDamage: [36, 61],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 51,
    requiredStats: { dex: 117 }

  }, {
    name: "Advanced Dualstring Bow",
    physicalDamage: [29, 54],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 55,
    requiredStats: { dex: 126 }

  }, {
    name: "Advanced Cultist Bow",
    physicalDamage: [41, 69],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 59,
    requiredStats: { dex: 135 }

  }, {
    name: "Advanced Zealot Bow",
    physicalDamage: [46, 69],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 62,
    requiredStats: { dex: 142 }

  }, {
    name: "Expert Shortbow",
    physicalDamage: [41, 76],
    critChance: 5,
    aps: 1.25,
    requiredLevel: 67,
    requiredStats: { dex: 174 }

  }, {
    name: "Expert Composite Bow",
    physicalDamage: [49, 82],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 72,
    requiredStats: { dex: 193 }

  }, {
    name: "Expert Warden Bow",
    physicalDamage: [53, 80],
    critChance: 5,
    aps: 1.15,
    requiredLevel: 77,
    requiredStats: { dex: 212 }

  }, {
    name: "Expert Dualstring Bow",
    physicalDamage: [39, 73],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 78,
    requiredStats: { dex: 212 }

  }, {
    name: "Expert Cultist Bow",
    physicalDamage: [52, 87],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 79,
    requiredStats: { dex: 212 }

  }, {
    name: "Expert Zealot Bow",
    physicalDamage: [56, 84],
    critChance: 5,
    aps: 1.2,
    requiredLevel: 77,
    requiredStats: { dex: 212 }
  }
];

const goodBows = bows
  .filter(bow => bow.name.includes("Expert"))
  .filter(bow => bow.aps >= 1.2);

const filterRules: Rule[] =
  goodBows.map(b => {
    return {
      blockType: "Show",
      conditions: {
        rarity: ["=", ["Rare", "Magic"]],
        baseType: ["=", [b.name]],
        itemLevel: [">=", [79]],
      },
      actions: {
        setBorderColor: [255, 0, 0,null],
        setTextColor: [255, 0, 0,null],
        // minimapIcon: [0, "Red", "Circle"],
      }
    }
  });

// const highlevelTricksterBases: Rule[] =
//   bodyArmours
//     .filter(ba => ba.energyShield >= 120 && ba.evasion == 0 && ba.armour == 0 && ba.requiredLevel >= 75)
//     .map(ba => {
//       return {
//         blockType: "Show",
//         conditions: {
//           rarity: ["=", ["Rare", "Magic"]],
//           baseType: ["=", [ba.name]],
//           itemLevel: [">=", [79]],
//         },
//       };
//     })

const tattered: Rule[] = [
  {
    blockType: "Show",
    conditions: {
      rarity: ["=", ["Normal"]],
      baseType: ["=", ["Tattered Robe"]]
    },
    actions: {
      setBorderColor: [255, 0, 0,null],
      setTextColor: [255, 0, 0,null],
      // minimapIcon: [0, "Red", "Circle"],
    }
  }
];

const baseFilter = fs.readFileSync("basefilter.filter", "utf-8");

const fullFilter = `
${render(tattered)}

${baseFilter}
`;

fs.writeFileSync("output.filter", fullFilter);

// const goodBows = bows
//   .filter(bow => bow.requiredLevel >= 60 && bow.critChance >= 5)
//   .filter(bow => bow.name.includes("Expert"))

// const myFilter: Rule[] = goodBows.map(bow => {
//   return {
//     blockType: "Hide",
//     conditions: {
//       rarity: ["=", ["Rare", "Magic"]],
//       baseType: ["=", [bow.name]],
//       // itemLevel: [">=", [79]],
//   },
//       actions: {
//         setBorderColor: [255, 0, 0,null],
//       }
//   };
// });

// const restOfBows: Rule[] = bows.filter(bow => !goodBows.includes(bow))
//   .map(bow => {
//     return {
//       blockType: "Show",
//     conditions: {
//       rarity: ["=", ["Rare", "Magic"]],
//       baseType: ["=", [bow.name]],
//       // itemLevel: [">=", [79]],
//   },
//       actions: {
//         setBorderColor: [255, 0, 0,null],
//         setTextColor: [255, 0, 0,null],
//         minimapIcon: [0, "Red", "Circle"],
//       }
//     };
//   })

// const baseFilter = fs.readFileSync("basefilter.filter", "utf-8");

// const fullFilter = `
// ${render([...myFilter, ...restOfBows])}

// ${baseFilter}
// `;

// fs.writeFileSync("output.filter", fullFilter);

const exportedItems = await importer.generateExportedItems("3.25.3.4")
console.log(exportedItems.find(x => x.baseItem.Name === "Crude Bow"));
console.log(exportedItems.filter(x => x.shieldInfo?.block > 20));
console.log(exportedItems.filter(x => x.weaponInfo?.aps > 1.45));
console.log(exportedItems.filter(x => x?.armourInfo?.movementSpeed <= 0));
