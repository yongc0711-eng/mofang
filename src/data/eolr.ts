// Bas, 04.08.2023: https://basilio.dev/cubing/images/ALGS-EOLR.pdf
// Audited diagram/setup mapping and reproducible MU completions: scripts/research/eolr/build-cases.mjs
import type { AlgCase } from '../types';

export const EOLR_CASES: (AlgCase & { sourceAlg: string | null; sourceMatch: string; computedPrefix: boolean })[] = [
  {
    "id": "eolr-3-1-1",
    "set": "eolr",
    "name": "EOLR 3/1-1",
    "group": "3/1",
    "algs": [
      "M"
    ],
    "setup": "M' U M2 U M'",
    "targetTier": "tier1",
    "reductionKey": "UB,UF,UL,UR|DF|DB|1|R",
    "continuationAlg": "U' M2 U' M",
    "isBadCase": false,
    "sourceCase": "3/1-1",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-3-1-2",
    "set": "eolr",
    "name": "EOLR 3/1-2",
    "group": "3/1",
    "algs": [
      "M' U' M'"
    ],
    "setup": "U M' U M",
    "targetTier": "tier2",
    "continuationAlg": "M2 U'",
    "isBadCase": false,
    "sourceCase": "3/1-2",
    "recognition": "短公式完成 EO 并把 LR 放入底层双槽；开启接续归位。",
    "sourceAlg": "M' U' M'",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-3-1-3",
    "set": "eolr",
    "name": "EOLR 3/1-3",
    "group": "3/1",
    "algs": [
      "M' U' M"
    ],
    "setup": "U M U' M",
    "targetTier": "tier1",
    "reductionKey": "|UF|DB|2|B",
    "continuationAlg": "M' U2 M' U'",
    "isBadCase": false,
    "sourceCase": "3/1-3",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U' M",
    "sourceMatch": "BFS_SETUP",
    "computedPrefix": false
  },
  {
    "id": "eolr-3-1-4",
    "set": "eolr",
    "name": "EOLR 3/1-4",
    "group": "3/1",
    "algs": [
      "U M' U2 M U"
    ],
    "setup": "M' U M U M2 U M U2 M U'",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|DF|UF|0|L",
    "continuationAlg": "M U' M2 U M'",
    "isBadCase": false,
    "sourceCase": "3/1-4",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "U M' U2 M U",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-3-1-5",
    "set": "eolr",
    "name": "EOLR 3/1-5",
    "group": "3/1",
    "algs": [
      "M' U' M'"
    ],
    "setup": "U M U2 M U2 M U M",
    "targetTier": "tier1",
    "reductionKey": "|UB|DB|2|F",
    "continuationAlg": "U2 M' U2 M' U'",
    "isBadCase": true,
    "sourceCase": "3/1-5",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": null,
    "sourceMatch": "BFS_SETUP",
    "computedPrefix": true
  },
  {
    "id": "eolr-3-1-6",
    "set": "eolr",
    "name": "EOLR 3/1-6",
    "group": "3/1",
    "algs": [
      "M' U M'"
    ],
    "setup": "U M U2 M U M' U M",
    "targetTier": "tier1",
    "reductionKey": "|UR|UF|0|R",
    "continuationAlg": "M2 U M' U2 M' U'",
    "isBadCase": true,
    "sourceCase": "3/1-6",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U M'",
    "sourceMatch": "BFS_SETUP",
    "computedPrefix": false
  },
  {
    "id": "eolr-3-1-7",
    "set": "eolr",
    "name": "EOLR 3/1-7",
    "group": "3/1",
    "algs": [
      "U2 M"
    ],
    "setup": "U M U' M U2 M' U2",
    "targetTier": "tier1",
    "reductionKey": "DF,UB,UL,UR|UL|DB|2|R",
    "continuationAlg": "U2 M' U M' U'",
    "isBadCase": true,
    "sourceCase": "3/1-7",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": null,
    "sourceMatch": "BFS_SETUP",
    "computedPrefix": true
  },
  {
    "id": "eolr-3-1-8",
    "set": "eolr",
    "name": "EOLR 3/1-8",
    "group": "3/1",
    "algs": [
      "U' M U'"
    ],
    "setup": "M' U M U M U M' U",
    "targetTier": "tier1",
    "reductionKey": "UB,UL|UL|DB|1|R",
    "continuationAlg": "M' U' M' U' M",
    "isBadCase": true,
    "sourceCase": "3/1-8",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": null,
    "sourceMatch": "DIRECT",
    "computedPrefix": true
  },
  {
    "id": "eolr-2a-2-1",
    "set": "eolr",
    "name": "EOLR 2a/2-1",
    "group": "2a/2",
    "algs": [
      "M2 U'"
    ],
    "setup": "M' U M U M2",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UF|DF|0|F",
    "continuationAlg": "M' U' M",
    "isBadCase": false,
    "sourceCase": "2a/2-1",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M2 U'",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2a-2-2",
    "set": "eolr",
    "name": "EOLR 2a/2-2",
    "group": "2a/2",
    "algs": [
      "M2 U'"
    ],
    "setup": "U M U' M' U' M2 U",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UL|DB|0|B",
    "continuationAlg": "M' U' M U' M2 U'",
    "isBadCase": false,
    "sourceCase": "2a/2-2",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M2 U'",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2a-2-3",
    "set": "eolr",
    "name": "EOLR 2a/2-3",
    "group": "2a/2",
    "algs": [
      "M' U M' U"
    ],
    "setup": "U M' U' M U' M U' M",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UB|UL|0|L",
    "continuationAlg": "M' U M U'",
    "isBadCase": false,
    "sourceCase": "2a/2-3",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U M' U",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2a-2-4",
    "set": "eolr",
    "name": "EOLR 2a/2-4",
    "group": "2a/2",
    "algs": [
      "U M' U' M' U'"
    ],
    "setup": "M' U M' U M' U M' U",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|DF|UF|2|B",
    "continuationAlg": "M' U M",
    "isBadCase": false,
    "sourceCase": "2a/2-4",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "U M' U' M' U'",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2a-2-5",
    "set": "eolr",
    "name": "EOLR 2a/2-5",
    "group": "2a/2",
    "algs": [
      "U2 M U2 M' U'"
    ],
    "setup": "M' U M' U' M U2 M U2",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|DF|UF|0|B",
    "continuationAlg": "M' U M",
    "isBadCase": false,
    "sourceCase": "2a/2-5",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "U2 M U2 M' U'",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2a-2-6",
    "set": "eolr",
    "name": "EOLR 2a/2-6",
    "group": "2a/2",
    "algs": [
      "M' U2 M U'"
    ],
    "setup": "U M U' M U' M2 U M U2 M",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|UL|UF|2|B",
    "continuationAlg": "M U' M U' M2 U'",
    "isBadCase": true,
    "sourceCase": "2a/2-6",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U2 M U'",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2a-2-7",
    "set": "eolr",
    "name": "EOLR 2a/2-7",
    "group": "2a/2",
    "algs": [
      "M' U2 M U'"
    ],
    "setup": "M' U M' U M' U2 M U2 M U M' U",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|DF|UF|2|F",
    "continuationAlg": "M U' M U2 M U2 M U' M2 U",
    "isBadCase": true,
    "sourceCase": "2a/2-7",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U2 M U'",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-4-0-1",
    "set": "eolr",
    "name": "EOLR 4/0-1",
    "group": "4/0",
    "algs": [
      "M' U2 M' U2"
    ],
    "setup": "M' U M2 U M' U2 M U2 M",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UF|DF|0|R",
    "continuationAlg": "M U' M2 U' M",
    "isBadCase": false,
    "sourceCase": "4/0-1",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U2 M' U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-4-0-2",
    "set": "eolr",
    "name": "EOLR 4/0-2",
    "group": "4/0",
    "algs": [
      "M' U2 M U2"
    ],
    "setup": "U M U' M U2 M U2 M",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UR|UB|0|L",
    "continuationAlg": "M' U' M U",
    "isBadCase": false,
    "sourceCase": "4/0-2",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U2 M U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-4-0-3",
    "set": "eolr",
    "name": "EOLR 4/0-3",
    "group": "4/0",
    "algs": [
      "M' U2 M U2"
    ],
    "setup": "M' U M U' M' U2 M U M' U2 M U",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UR|DF|0|R",
    "continuationAlg": "M' U' M U' M2 U' M' U2 M U'",
    "isBadCase": true,
    "sourceCase": "4/0-3",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U2 M U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-4-0-4",
    "set": "eolr",
    "name": "EOLR 4/0-4",
    "group": "4/0",
    "algs": [
      "M' U M' U M U M U"
    ],
    "setup": "U M' U2 M U2 M U M U2 M U2 M",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UB|UL|0|R",
    "continuationAlg": "M' U' M2 U2 M U",
    "isBadCase": true,
    "sourceCase": "4/0-4",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U M' U M U M U",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2o-2-1",
    "set": "eolr",
    "name": "EOLR 2o/2-1",
    "group": "2o/2",
    "algs": [
      "M' U2 M U2"
    ],
    "setup": "M' U M2 U M U2 M U2 M",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|UB|DB|0|R",
    "continuationAlg": "M' U M2 U M",
    "isBadCase": false,
    "sourceCase": "2o/2-1",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U2 M U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2o-2-2",
    "set": "eolr",
    "name": "EOLR 2o/2-2",
    "group": "2o/2",
    "algs": [
      "M' U2 M U2"
    ],
    "setup": "U M' U' M' U2 M U2 M",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|UF|UL|0|L",
    "continuationAlg": "M U' M' U",
    "isBadCase": false,
    "sourceCase": "2o/2-2",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U2 M U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2o-2-3",
    "set": "eolr",
    "name": "EOLR 2o/2-3",
    "group": "2o/2",
    "algs": [
      "M2 U M' U2 M' U2"
    ],
    "setup": "M' U M U2 M U2 M U M2",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|DF|UF|0|B",
    "continuationAlg": "M' U M",
    "isBadCase": false,
    "sourceCase": "2o/2-3",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M2 U M' U2 M' U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2o-2-4",
    "set": "eolr",
    "name": "EOLR 2o/2-4",
    "group": "2o/2",
    "algs": [
      "M2 U M' U2 M' U2"
    ],
    "setup": "M' U M' U' M' U' M U M U2 M U2",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UR|UB|0|F",
    "continuationAlg": "M' U' M' U' M2 U",
    "isBadCase": false,
    "sourceCase": "2o/2-4",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M2 U M' U2 M' U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2o-2-5",
    "set": "eolr",
    "name": "EOLR 2o/2-5",
    "group": "2o/2",
    "algs": [
      "M' U M U M' U M' U"
    ],
    "setup": "U M U M' U M U M U M' U M",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|UR|UF|0|R",
    "continuationAlg": "M U M U2 M2 U'",
    "isBadCase": true,
    "sourceCase": "2o/2-5",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U M U M' U M' U",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2o-2-6",
    "set": "eolr",
    "name": "EOLR 2o/2-6",
    "group": "2o/2",
    "algs": [
      "M U2 M' U2"
    ],
    "setup": "U M' U' M' U M U M U' M' U' M",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|DF|UL|0|L",
    "continuationAlg": "M' U M U M2 U M U2 M U'",
    "isBadCase": true,
    "sourceCase": "2o/2-6",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M U2 M' U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2o-0-1",
    "set": "eolr",
    "name": "EOLR 2o/0-1",
    "group": "2o/0",
    "algs": [
      "M' U M U'"
    ],
    "setup": "U M' U M' U' M U M'",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UF|UR|2|R",
    "continuationAlg": "M' U M U' M U2 M' U' M2 U",
    "isBadCase": false,
    "sourceCase": "2o/0-1",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U M U'",
    "sourceMatch": "LR_MIRROR",
    "computedPrefix": false
  },
  {
    "id": "eolr-2o-0-2",
    "set": "eolr",
    "name": "EOLR 2o/0-2",
    "group": "2o/0",
    "algs": [
      "M' U' M U"
    ],
    "setup": "U M' U M U' M' U M",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UB|UR|0|R",
    "continuationAlg": "M' U' M U'",
    "isBadCase": false,
    "sourceCase": "2o/0-2",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U' M U",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2o-0-3",
    "set": "eolr",
    "name": "EOLR 2o/0-3",
    "group": "2o/0",
    "algs": [
      "M U' M' U'"
    ],
    "setup": "U M' U' M' U' M U M'",
    "targetTier": "tier1",
    "reductionKey": "DB,UF,UL,UR|DF|UR|2|R",
    "continuationAlg": "U2 M U M U'",
    "isBadCase": false,
    "sourceCase": "2o/0-3",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M U' M' U'",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2o-0-4",
    "set": "eolr",
    "name": "EOLR 2o/0-4",
    "group": "2o/0",
    "algs": [
      "M' U' M"
    ],
    "setup": "U M' U M U M' U' M",
    "targetTier": "tier1",
    "reductionKey": "DF,UB,UF,UR|UL|DF|0|F",
    "continuationAlg": "M' U2 M U' M' U' M U'",
    "isBadCase": false,
    "sourceCase": "2o/0-4",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U' M",
    "sourceMatch": "LR_MIRROR",
    "computedPrefix": false
  },
  {
    "id": "eolr-2o-0-5",
    "set": "eolr",
    "name": "EOLR 2o/0-5",
    "group": "2o/0",
    "algs": [
      "M' U' M' U' M' U2 M"
    ],
    "setup": "U' M U' M' U' M' U2 M U' M U' M",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UF,UR|UL|UB|0|F",
    "continuationAlg": "U' M U' M' U",
    "isBadCase": true,
    "sourceCase": "2o/0-5",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "R U R' U' M' U R U' r'",
    "sourceMatch": "DIRECT",
    "computedPrefix": true
  },
  {
    "id": "eolr-2o-0-6",
    "set": "eolr",
    "name": "EOLR 2o/0-6",
    "group": "2o/0",
    "algs": [
      "M' U' M' U' M' U2 M"
    ],
    "setup": "M' U M' U M' U2 M U M U M",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UF,UR|DB|UR|2|R",
    "continuationAlg": "U' M U' M",
    "isBadCase": true,
    "sourceCase": "2o/0-6",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U' M' U' M' U2 M",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-0-2-1",
    "set": "eolr",
    "name": "EOLR 0/2-1",
    "group": "0/2",
    "algs": [
      "M' U M' U'"
    ],
    "setup": "M' U M' U' M U M U",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|UB|DB|2|R",
    "continuationAlg": "M' U M2 U M'",
    "isBadCase": false,
    "sourceCase": "0/2-1",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U M' U'",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-0-2-2",
    "set": "eolr",
    "name": "EOLR 0/2-2",
    "group": "0/2",
    "algs": [
      "M' U' M' U"
    ],
    "setup": "U M U M' U' M U M",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|UL|UF|0|R",
    "continuationAlg": "M U' M' U'",
    "isBadCase": false,
    "sourceCase": "0/2-2",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U' M' U",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-0-2-3",
    "set": "eolr",
    "name": "EOLR 0/2-3",
    "group": "0/2",
    "algs": [
      "M' U M' U'"
    ],
    "setup": "U M U' M' U' M U M",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|DB|UF|0|L",
    "continuationAlg": "U M U2 M' U M U M' U'",
    "isBadCase": false,
    "sourceCase": "0/2-3",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U M' U'",
    "sourceMatch": "LR_MIRROR",
    "computedPrefix": false
  },
  {
    "id": "eolr-0-2-4",
    "set": "eolr",
    "name": "EOLR 0/2-4",
    "group": "0/2",
    "algs": [
      "M' U M U M U2 M' U"
    ],
    "setup": "M' U M' U' M U2 M U M' U M U",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UB|UL|0|R",
    "continuationAlg": "M' U' M2 U2 M U",
    "isBadCase": true,
    "sourceCase": "0/2-4",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U M U M U2 M' U",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2a-0-1",
    "set": "eolr",
    "name": "EOLR 2a/0-1",
    "group": "2a/0",
    "algs": [
      "M' U M' U2"
    ],
    "setup": "M' U M' U2 M U' M2 U M U",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|DB|UL|0|B",
    "continuationAlg": "M U' M2 U M U",
    "isBadCase": false,
    "sourceCase": "2a/0-1",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U M' U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2a-0-2",
    "set": "eolr",
    "name": "EOLR 2a/0-2",
    "group": "2a/0",
    "algs": [
      "U2 M U M' U2"
    ],
    "setup": "M' U M U' M' U' M' U' M2",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|UR|DF|0|B",
    "continuationAlg": "M U' M' U M2 U",
    "isBadCase": false,
    "sourceCase": "2a/0-2",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "U2 M U M' U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2a-0-3",
    "set": "eolr",
    "name": "EOLR 2a/0-3",
    "group": "2a/0",
    "algs": [
      "M' U M U2"
    ],
    "setup": "U M2 U M' U' M U2 M U' M",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UR|UB|0|F",
    "continuationAlg": "M' U' M' U' M2 U",
    "isBadCase": false,
    "sourceCase": "2a/0-3",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U M U2",
    "sourceMatch": "PDF_FLAP_ARTIFACT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2a-0-4",
    "set": "eolr",
    "name": "EOLR 2a/0-4",
    "group": "2a/0",
    "algs": [
      "M' U M' U2"
    ],
    "setup": "U M' U M' U2 M U M' U",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UR|UB|0|F",
    "continuationAlg": "M' U' M' U' M2 U",
    "isBadCase": false,
    "sourceCase": "2a/0-4",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U M' U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2a-0-5",
    "set": "eolr",
    "name": "EOLR 2a/0-5",
    "group": "2a/0",
    "algs": [
      "M2 U M' U M U"
    ],
    "setup": "M' U M' U M U M' U' M U M U",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UB|UR|2|B",
    "continuationAlg": "M' U' M' U' M2 U'",
    "isBadCase": false,
    "sourceCase": "2a/0-5",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M2 U M' U M U",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2a-0-6",
    "set": "eolr",
    "name": "EOLR 2a/0-6",
    "group": "2a/0",
    "algs": [
      "M U2 M' U M U M' U"
    ],
    "setup": "M' U M U M' U M U M U2 M",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|UB|DB|2|B",
    "continuationAlg": "M U M",
    "isBadCase": true,
    "sourceCase": "2a/0-6",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M U2 M' U M U M' U",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-2a-0-7",
    "set": "eolr",
    "name": "EOLR 2a/0-7",
    "group": "2a/0",
    "algs": [
      "U' M' U M U M' U M U"
    ],
    "setup": "M' U M U' M' U' M U' M' U' M U",
    "targetTier": "tier1",
    "reductionKey": "DF,UF,UL,UR|UF|DF|0|F",
    "continuationAlg": "M' U' M",
    "isBadCase": true,
    "sourceCase": "2a/0-7",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "U' M' U M U M' U M U",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-1-1-1",
    "set": "eolr",
    "name": "EOLR 1/1-1",
    "group": "1/1",
    "algs": [
      "M U' M' U"
    ],
    "setup": "U M' U' M' U M U M",
    "targetTier": "tier1",
    "reductionKey": "DB,UF,UL,UR|UF|UR|0|R",
    "continuationAlg": "U' M U2 M U' M2 U' M U' M'",
    "isBadCase": false,
    "sourceCase": "1/1-1",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M U' M' U",
    "sourceMatch": "LR_MIRROR",
    "computedPrefix": false
  },
  {
    "id": "eolr-1-1-2",
    "set": "eolr",
    "name": "EOLR 1/1-2",
    "group": "1/1",
    "algs": [
      "M U' M' U'"
    ],
    "setup": "U M U M' U M U M'",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|UL|UF|0|R",
    "continuationAlg": "M U' M' U'",
    "isBadCase": false,
    "sourceCase": "1/1-2",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M U' M' U'",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-1-1-3",
    "set": "eolr",
    "name": "EOLR 1/1-3",
    "group": "1/1",
    "algs": [
      "M U M' U"
    ],
    "setup": "U M' U M' U M U M'",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|DF|UL|2|R",
    "continuationAlg": "M U' M2 U2 M U",
    "isBadCase": false,
    "sourceCase": "1/1-3",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M U M' U",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-1-1-4",
    "set": "eolr",
    "name": "EOLR 1/1-4",
    "group": "1/1",
    "algs": [
      "U M' U' M U2"
    ],
    "setup": "U M' U' M' U2 M U' M U",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|UR|UF|0|L",
    "continuationAlg": "M U M' U'",
    "isBadCase": false,
    "sourceCase": "1/1-4",
    "recognition": "短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "U M' U' M U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-1-1-5",
    "set": "eolr",
    "name": "EOLR 1/1-5",
    "group": "1/1",
    "algs": [
      "M U M' U2"
    ],
    "setup": "M' U M' U' M U' M' U2 M U M' U2",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UF,UR|UB|UR|2|B",
    "continuationAlg": "M U2 M U M2 U' M' U' M",
    "isBadCase": true,
    "sourceCase": "1/1-5",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M U M' U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-1-1-6",
    "set": "eolr",
    "name": "EOLR 1/1-6",
    "group": "1/1",
    "algs": [
      "U M U' M' U2"
    ],
    "setup": "M U' M U' M U2 M U' M' U' M U",
    "targetTier": "tier1",
    "reductionKey": "DB,UL|DF|DB|0|F",
    "continuationAlg": "U M U M' U2 M' U M' U M U M'",
    "isBadCase": true,
    "sourceCase": "1/1-6",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "U M U' M' U2",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-4-2-1",
    "set": "eolr",
    "name": "EOLR 4/2-1",
    "group": "4/2",
    "algs": [
      "M U' M U2 M' U M' U"
    ],
    "setup": "M' U M U' M' U' M U2 M U M",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|UB|UL|2|F",
    "continuationAlg": "M U M' U' M U2 M' U",
    "isBadCase": true,
    "sourceCase": "4/2-1",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M U' M U2 M' U M' U",
    "sourceMatch": "LR_MIRROR",
    "computedPrefix": false
  },
  {
    "id": "eolr-4-2-2",
    "set": "eolr",
    "name": "EOLR 4/2-2",
    "group": "4/2",
    "algs": [
      "M' U M U2 M' U' M' U'"
    ],
    "setup": "U M' U' M' U2 M' U' M U' M' U' M",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|UF|UL|0|L",
    "continuationAlg": "M U' M' U",
    "isBadCase": true,
    "sourceCase": "4/2-2",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U M U2 M' U' M' U'",
    "sourceMatch": "DIRECT",
    "computedPrefix": false
  },
  {
    "id": "eolr-4-2-3",
    "set": "eolr",
    "name": "EOLR 4/2-3",
    "group": "4/2",
    "algs": [
      "M' U M U2 M U M' U"
    ],
    "setup": "U M' U' M' U2 M' U' M U' M' U' M'",
    "targetTier": "tier1",
    "reductionKey": "DB,UB,UL,UR|UR|UF|0|L",
    "continuationAlg": "M U M' U'",
    "isBadCase": true,
    "sourceCase": "4/2-3",
    "recognition": "不利情形，优先按常规 EO 化归。短公式停在化归中间态，开启接续完成 LR。",
    "sourceAlg": "M' U M U2 M U M' U",
    "sourceMatch": "PDF_FLAP_ARTIFACT",
    "computedPrefix": false
  }
];

// Legal source-label permutations of only the other four M edges.
export const EOLR_NUISANCE_ALGS = [
  "",
  "U2 M U2 M'",
  "U2 M' U2 M",
  "U2 M2 U2 M2",
  "M U2 M' U2",
  "M' U2 M U2",
  "M U2 M U2 M2",
  "M U2 M2 U2 M",
  "M' U2 M' U2 M2",
  "M2 U2 M U2 M",
  "M2 U2 M' U2 M'",
  "U2 M U2 M2 U2 M U2"
];
