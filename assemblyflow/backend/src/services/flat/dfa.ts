import {
  DFADefinition,
  DFATraceResult,
  DFAStep,
} from './types';

/**
 * Formal 5-tuple specification of the Register Identifier DFA M = (Q, Σ, δ, q0, F)
 * Language Recognized: L = { R0, R1, R2, ..., R15 } (case-insensitive for 'r' or 'R')
 */
export const REGISTER_DFA_DEFINITION: DFADefinition = {
  name: 'Register Identifier Token DFA (R0–R15)',
  languageDescription:
    'Recognizes valid register tokens R0 through R15. Initial letter is case-insensitive (R or r). Full numbers beyond 15 transition to the trap/rejection state q_trap.',
  states: ['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q_trap'],
  startState: 'q0',
  acceptingStates: ['q2', 'q3', 'q4', 'q5'],
  alphabet: ['R', 'r', '0', '1', '2-5', '6-9', 'other'],
  transitions: [
    {
      fromState: 'q0',
      symbol: 'R, r',
      toState: 'q1',
      description: "Read register prefix letter 'R' or 'r'.",
    },
    {
      fromState: 'q0',
      symbol: 'other',
      toState: 'q_trap',
      description: "Any character other than 'R' or 'r' violates register prefix.",
    },
    {
      fromState: 'q1',
      symbol: '0',
      toState: 'q2',
      description: "Digit '0' matches register R0 (Accepting).",
    },
    {
      fromState: 'q1',
      symbol: '1',
      toState: 'q3',
      description: "Digit '1' matches R1 (Accepting) or begins tens-digit for R10-R15.",
    },
    {
      fromState: 'q1',
      symbol: '2-9',
      toState: 'q4',
      description: "Digits '2' through '9' match registers R2 through R9 (Accepting).",
    },
    {
      fromState: 'q1',
      symbol: 'other',
      toState: 'q_trap',
      description: 'Missing digit or non-numeric character after register prefix.',
    },
    {
      fromState: 'q2',
      symbol: 'any',
      toState: 'q_trap',
      description: "Extra trailing characters after 'R0' are invalid (e.g. R01, R0A).",
    },
    {
      fromState: 'q3',
      symbol: '0-5',
      toState: 'q5',
      description: "Second digit '0' through '5' matches registers R10 through R15 (Accepting).",
    },
    {
      fromState: 'q3',
      symbol: '6-9',
      toState: 'q_trap',
      description: "Registers R16 through R19 exceed the allowed hardware range (R0–R15).",
    },
    {
      fromState: 'q3',
      symbol: 'other',
      toState: 'q_trap',
      description: "Non-numeric character after 'R1'.",
    },
    {
      fromState: 'q4',
      symbol: 'any',
      toState: 'q_trap',
      description: 'Two-digit registers starting with 2-9 (e.g. R20) exceed range R0-R15.',
    },
    {
      fromState: 'q5',
      symbol: 'any',
      toState: 'q_trap',
      description: 'Trailing characters after valid register R10-R15.',
    },
    {
      fromState: 'q_trap',
      symbol: 'any',
      toState: 'q_trap',
      description: 'Dead/Trap state loops indefinitely on all subsequent inputs.',
    },
  ],
};

/**
 * Transition function δ(state, char) -> nextState
 */
function transition(state: string, char: string): { nextState: string; note: string } {
  if (state === 'q0') {
    if (char === 'R' || char === 'r') {
      return { nextState: 'q1', note: `Read prefix '${char}', state is now q1.` };
    }
    return {
      nextState: 'q_trap',
      note: `Invalid register prefix '${char}'. Must begin with 'R' or 'r'. Transitioning to q_trap.`,
    };
  }

  if (state === 'q1') {
    if (char === '0') {
      return { nextState: 'q2', note: `Read digit '0'. Recognized register R0 (Accepting state q2).` };
    }
    if (char === '1') {
      return {
        nextState: 'q3',
        note: `Read digit '1'. Recognized register R1 (Accepting state q3, can also accept R10-R15).`,
      };
    }
    if (char >= '2' && char <= '9') {
      return {
        nextState: 'q4',
        note: `Read digit '${char}'. Recognized register R${char} (Accepting state q4).`,
      };
    }
    return {
      nextState: 'q_trap',
      note: `Expected digit (0-9) after register prefix, found '${char}'. Transitioning to q_trap.`,
    };
  }

  if (state === 'q2') {
    return {
      nextState: 'q_trap',
      note: `Unexpected trailing character '${char}' after R0. Transitioning to q_trap.`,
    };
  }

  if (state === 'q3') {
    if (char >= '0' && char <= '5') {
      return {
        nextState: 'q5',
        note: `Read second digit '${char}'. Recognized two-digit register R1${char} (Accepting state q5).`,
      };
    }
    if (char >= '6' && char <= '9') {
      return {
        nextState: 'q_trap',
        note: `Register R1${char} is out of bounds (allowed range: R0–R15). Transitioning to q_trap.`,
      };
    }
    return {
      nextState: 'q_trap',
      note: `Invalid character '${char}' following R1. Transitioning to q_trap.`,
    };
  }

  if (state === 'q4') {
    return {
      nextState: 'q_trap',
      note: `Unexpected second digit or character '${char}'. Registers starting with 2-9 cannot have two digits in R0-R15. Transitioning to q_trap.`,
    };
  }

  if (state === 'q5') {
    return {
      nextState: 'q_trap',
      note: `Unexpected character '${char}' after two-digit register. Transitioning to q_trap.`,
    };
  }

  // q_trap loops
  return { nextState: 'q_trap', note: `In trap state q_trap. Reading '${char}' remains in q_trap.` };
}

/**
 * Simulates a candidate string through the register token DFA.
 * Time Complexity: O(K) where K is string length.
 */
export function simulateRegisterDFA(input: string): DFATraceResult {
  const acceptingSet = new Set(REGISTER_DFA_DEFINITION.acceptingStates);
  let currentState = REGISTER_DFA_DEFINITION.startState;
  const path: string[] = [currentState];
  const steps: DFAStep[] = [];

  if (!input || input.length === 0) {
    return {
      input: '',
      isAccepted: false,
      finalState: currentState,
      path,
      steps: [],
      explanation: 'Empty input string. Did not reach any accepting state.',
    };
  }

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const { nextState, note } = transition(currentState, char);
    const isAcc = acceptingSet.has(nextState);

    steps.push({
      step: i + 1,
      inputChar: char,
      fromState: currentState,
      toState: nextState,
      isAccepting: isAcc,
      note,
    });

    currentState = nextState;
    path.push(currentState);
  }

  const isAccepted = acceptingSet.has(currentState);

  let explanation = '';
  if (isAccepted) {
    explanation = `String '${input}' successfully ended in accepting state '${currentState}'. It is a valid register identifier (R0–R15).`;
  } else if (currentState === 'q_trap') {
    explanation = `String '${input}' entered rejecting trap state 'q_trap'. It does not conform to the R0–R15 token pattern.`;
  } else {
    explanation = `String '${input}' terminated in non-accepting state '${currentState}'. Incomplete register token.`;
  }

  return {
    input,
    isAccepted,
    finalState: currentState,
    path,
    steps,
    explanation,
  };
}
