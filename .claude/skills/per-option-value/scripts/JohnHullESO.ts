#!/usr/bin/env bun


declare const process: { argv: string[]; exit: (code?: number) => never };

/**
 * Calculates ESO value using Enhanced FASB 123 trinomial tree (John Hull style)
 */
function johnHullESO(
  S: number,
  K: number,
  T: number,
  Vol: number,
  r: number,
  q: number,
  exerciseMultiple: number,
  exitRatePreVest: number,
  exitRatePostVest: number,
  vestTime: number
): number {
  const n = 200;
  const EPS = 1e-6;

  if (S <= 0) throw new Error("Stock price must be positive");
  if (K <= 0) throw new Error("Strike price must be positive");
  if (vestTime < 0) throw new Error("Vesting time cannot be negative");
  if (T <= vestTime + EPS) throw new Error("Total life must be longer than vesting time");
  if (exerciseMultiple < 1) throw new Error("Exercise multiple must be > 1");
  if (exitRatePreVest < 0 || exitRatePreVest >= 1) throw new Error("Pre-vest exit rate must be in [0, 1)");
  if (exitRatePostVest < 0 || exitRatePostVest >= 1) throw new Error("Post-vest exit rate must be in [0, 1)");
  if (Vol <= 0) throw new Error("Volatility must be positive");
  if (r < 0) throw new Error("Interest rate cannot be negative");
  if (q < 0) throw new Error("Dividend yield cannot be negative");

  if (S >= K * exerciseMultiple - EPS && vestTime < 1e-4) {
    return S - K;
  }

  const lambdaPost = Math.log(1 + exitRatePostVest);

  const dt = T / n;
  const disc = Math.exp(-r * dt);

  let isInterp = false;
  let exMult1 = exerciseMultiple;
  let exMult2 = exerciseMultiple;

  const logTarget = Math.log(K * exerciseMultiple) - Math.log(S);
  let var1 = logTarget - Vol * Math.sqrt(dt);

  if (var1 <= 0) {
    isInterp = true;
    exMult1 = S / K;
    exMult2 = (S / K) * Math.exp(Vol * Math.sqrt(dt));
  }

  let finalValue = 0;
  const runs = isInterp ? 2 : 1;

  for (let run = 1; run <= runs; run++) {
    const currentMult = run === 1 ? exMult1 : exMult2;

    let nval = Math.round(
      (Math.log(K * currentMult) - Math.log(S)) / (Vol * Math.sqrt(3 * dt))
    );

    let u: number;
    if (nval > 0) {
      u = Math.exp((Math.log(K * currentMult) - Math.log(S)) / nval);
    } else {
      u = Math.exp(Vol * Math.sqrt(3 * dt));
    }

    const d = 1 / u;

    const drift = Math.exp((r - q) * dt);
    const drift2 = Math.exp(2 * (r - q) * dt) + Vol * Vol * dt;

    const pu = ((drift - 1) * (d + 1) - drift2 + 1) / ((d + 1) * (u - 1) - u * u + 1);
    const pd = ((drift - 1) * (u + 1) - drift2 + 1) / ((u + 1) * (d - 1) - d * d + 1);
    const pm = 1 - pu - pd;

    const V = new Array<number>(2 * n + 1).fill(0);
    const timeToEx = new Array<number>(2 * n + 1).fill(0);

    for (let i = 0; i <= 2 * n; i++) {
      const price = S * Math.pow(u, i - n);
      V[i] = Math.max(price - K, 0);
    }

    for (let j = n - 1; j >= 0; j--) {
      const t = j * dt;
      for (let i = 0; i <= 2 * j; i++) {
        const price = S * Math.pow(u, i - j);

        let contV = pu * V[i + 2] + pm * V[i + 1] + pd * V[i];
        let newV = contV * disc;
        let newTTE = pu * timeToEx[i + 2] + pm * timeToEx[i + 1] + pd * timeToEx[i] + dt;

        if (t > vestTime - 1e-4) {
          const intrinsic = Math.max(price - K, 0);
          newTTE *= 1 - lambdaPost * dt;

          if (price >= currentMult * K - EPS) {
            newV = intrinsic;
            newTTE = 0;
          }

          newV = lambdaPost * dt * intrinsic + (1 - lambdaPost * dt) * newV;
        }

        V[i] = newV;
        timeToEx[i] = newTTE;
      }
    }

    const treeValue = V[0];
    const survivalPreVest = Math.pow(1 - exitRatePreVest, vestTime);
    const vestedValue = treeValue * survivalPreVest;

    if (run === 1) {
      finalValue = vestedValue;
    } else {
      const frac = (exerciseMultiple - exMult1) / (exMult2 - exMult1);
      finalValue += (vestedValue - finalValue) * frac;
    }
  }

  return finalValue;
}

// ─────────────────────────────────────────────
//          COMMAND LINE ARGUMENT PARSER
// ─────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Per-option ESO value calculator (Enhanced FASB 123 / John Hull trinomial tree)

Usage:
  bun john-hull-eso.ts [options]

Options (with defaults):
  --S             Current stock price                  0.101
  --K             Strike price                         0.180
  --T             Total term (years)                   2.0
  --V             Volatility (decimal)                 0.5084
  --R             Risk-free rate (decimal)             0.0387
  --Q             Dividend yield (decimal)             0.0
  --exMult        Exercise multiple                    1.44
  --preVest       Pre-vesting exit/forfeiture rate     0.0
  --postVest      Post-vesting exit rate               0.2485
  --vestTime      Time to vesting (years)              1.0
  --help, -h      Show this help message
  `);
  process.exit(0);
}

function getNumberArg(flag: string, defaultValue: number): number {
  const idx = args.indexOf(`--${flag}`);
  if (idx === -1) return defaultValue;
  const val = Number(args[idx + 1]);
  if (isNaN(val)) {
    console.warn(`Warning: invalid number after --${flag}, using default ${defaultValue}`);
    return defaultValue;
  }
  return val;
}

const S               = getNumberArg("S",        0.101);
const K               = getNumberArg("K",        0.180);
const T               = getNumberArg("T",        2.0);
const Vol             = getNumberArg("V",        0.5084);
const r               = getNumberArg("R",        0.0387);
const q               = getNumberArg("Q",        0.0);
const exMult          = getNumberArg("exMult",   1.44);
const preVest         = getNumberArg("preVest",  0.0);
const postVest        = getNumberArg("postVest", 0.2485);
const vestTime        = getNumberArg("vestTime", 1.0);

// ─────────────────────────────────────────────
//                RUN CALCULATION
// ─────────────────────────────────────────────

try {
  const value = johnHullESO(
    S, K, T, Vol, r, q,
    exMult, preVest, postVest, vestTime
  );

  console.log(JSON.stringify({
    // inputs: { S, K, T, Vol, r, q, exMult, preVest, postVest, vestTime },
    PerOptionValue: Math.round(value * 1000) / 1000,
  }));
} catch (err: any) {
  console.log(JSON.stringify({ error: err.message }));
  process.exit(1);
}