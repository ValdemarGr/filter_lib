import * as fs from 'fs';
import * as importer from './importer.js';

type Operator = "=" | "!" | "<" | "<=" | ">" | ">=";

type EquipmentRarity = "Normal" | "Magic" | "Rare" | "Unique"

type RGBA = [number, number, number, number | null];

type StandardColor = "Red" | "Green" | "Blue" | "Brown" | "White" | "Yellow" | "Orange" | "Purple" | "Cyan" | "Gray" | "Black" | "Pink"

type Conditions = {
  areaLevel?: [Operator, number[]];
  waystoneTier?: [Operator, number[]];
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
    return b;
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

function renderQuoteds(s: string[]): string {
  return s.map(x => `"${x}"`).join(" ");
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
      ["WaystoneTier", map(c?.areaLevel, renderBinaryTuple)],
      ["ItemLevel", map(c?.itemLevel, renderBinaryTuple)],
      ["DropLevel", map(c?.dropLevel, renderBinaryTuple)],
      ["Quality", map(c?.quality, renderBinaryTuple)],
      ["Rarity", map(c?.rarity, renderBinaryTuple)],
      ["Class", map(c?.class, x => renderBinaryTuple([x[0], [renderQuoteds(x[1])]]))],
      ["BaseType", map(c?.baseType, x => renderBinaryTuple([x[0], [renderQuoteds(x[1])]]))],
      ["Prophecy", map(c?.prophecy, renderQuoteds)],
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
      ["CustomAlertSound", map(a?.customAlertSound, x => renderQuoteds([x]))],
      ["MinimapIcon", map(a?.minimapIcon, x => [renderValue(x[0]), x[1], x[2]].join(" "))],
      ["PlayEffect", map(a?.playEffect, renderValues)],
    ];
    return parts.filter((x) => x[1] != null).map(x => `${x[0] === null ? "" : (x[0] + " ")}${x[1]}`).join("\n");
  });

  return renderedRules.join("\n\n");
};

// const exportedItems = await importer.generateExportedItems("3.25.3.4")
const exportedItems = await importer.generateExportedItems("4.1.0.11")
// console.log(exportedItems.find(x => x.baseItem.Name === "Crude Bow"));
// console.log(exportedItems.filter(x => x.shieldInfo?.block > 20));
// console.log(exportedItems.filter(x => x.weaponInfo?.aps > 1.45));
// console.log(exportedItems.filter(x => x?.armourInfo?.energyShieldMin >= 10 && x.armourInfo?.evasionMin >= 50));

function mediumImportanceHighlight(rule: Rule): Rule {
  return {
    ...rule, actions: {
      ...rule.actions,
      setBorderColor: [255, 0, 0, null],
      setTextColor: [255, 0, 0, null],
      minimapIcon: [0, "Red", "Circle"],
      playAlertSound: [1, 100],
      setFontSize: 35
    }
  };
}

const esBases = exportedItems
  .filter(x => x?.armourInfo?.energyShieldMin > 0 && !(x.armourInfo?.evasionMin > 0) && !(x.armourInfo?.armourMin > 0))
  .filter(x => x.baseItem.Name.includes("Expert"))
  .map<Rule>(x => mediumImportanceHighlight({
    blockType: "Show",
    conditions: { baseType: ["=", [x.baseItem.Name]] },
  }));

const wands = exportedItems
  .filter(x => x.baseItem.Name.includes("Wand") && !x.baseItem.Name.includes("Random"))
  .map<Rule>(x => mediumImportanceHighlight({
    blockType: "Show",
    conditions: { baseType: ["=", [x.baseItem.Name]] },
  }))

const baseFilter = fs.readFileSync("basefilter.filter", "utf-8");

const fullFilter = `
${render([...esBases, ...wands])}

${baseFilter}
`;

fs.writeFileSync("output.filter", fullFilter);
