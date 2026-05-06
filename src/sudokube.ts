export type FaceArray = number[];

export interface FaceValidationResult {
  valid: boolean;
  missing: number[];
  duplicates: number[];
  invalidPositions: number[];
}

export interface CubeState {
  faces: {
    U: FaceArray;
    D: FaceArray;
    F: FaceArray;
    B: FaceArray;
    L: FaceArray;
    R: FaceArray;
    [key: string]: FaceArray | undefined;
  };
}

export interface CubeValidationResult {
  valid: boolean;
  faces: Record<string, FaceValidationResult>;
}

export interface SolveFaceResult {
  original: FaceArray;
  diagnostic: FaceValidationResult;
  suggested: FaceArray;
}

export interface SolveCubeResult {
  valid: boolean;
  faces: Record<string, SolveFaceResult>;
}

export const FACE_NAMES = ['U', 'D', 'F', 'B', 'L', 'R'];

export function validateFace(face: any[]): FaceValidationResult {
  const missing: number[] = [];
  const duplicates: number[] = [];
  const invalidPositions: number[] = [];
  
  const counts = new Map<number, number>();

  if (!Array.isArray(face) || face.length !== 9) {
    return {
      valid: false,
      missing: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      duplicates: [],
      invalidPositions: Array.from({ length: Array.isArray(face) ? face.length : 0 }, (_, i) => i)
    };
  }

  for (let i = 0; i < 9; i++) {
    const val = face[i];
    if (typeof val !== 'number' || val < 1 || val > 9 || !Number.isInteger(val)) {
      invalidPositions.push(i);
    } else {
      counts.set(val, (counts.get(val) || 0) + 1);
    }
  }

  for (let i = 1; i <= 9; i++) {
    const count = counts.get(i) || 0;
    if (count === 0) {
      missing.push(i);
    } else if (count > 1) {
      duplicates.push(i);
    }
  }

  const valid = missing.length === 0 && duplicates.length === 0 && invalidPositions.length === 0;

  return { valid, missing, duplicates, invalidPositions };
}

export function validateCube(cube: CubeState): CubeValidationResult {
  let isCubeValid = true;
  const facesResult: Record<string, FaceValidationResult> = {};

  if (!cube || !cube.faces) {
    return { valid: false, faces: {} };
  }

  for (const faceName of FACE_NAMES) {
    const faceData = cube.faces[faceName];
    if (!faceData) {
      isCubeValid = false;
      facesResult[faceName] = {
        valid: false,
        missing: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        duplicates: [],
        invalidPositions: []
      };
      continue;
    }

    const faceValidation = validateFace(faceData);
    facesResult[faceName] = faceValidation;
    if (!faceValidation.valid) {
      isCubeValid = false;
    }
  }

  return {
    valid: isCubeValid,
    faces: facesResult
  };
}

export function solveFace(face: any[]): SolveFaceResult {
  const diagnostic = validateFace(face);
  const suggested: number[] = Array(9).fill(0);
  
  if (!Array.isArray(face) || face.length !== 9) {
    return {
      original: face,
      diagnostic,
      suggested: [1, 2, 3, 4, 5, 6, 7, 8, 9] // Default valid face
    };
  }

  const seen = new Set<number>();
  const problematicIndices: number[] = [];

  // Step 1 & 2: Keep first valid appearance, find problematic positions
  for (let i = 0; i < 9; i++) {
    const val = face[i];
    if (typeof val === 'number' && Number.isInteger(val) && val >= 1 && val <= 9 && !seen.has(val)) {
      suggested[i] = val;
      seen.add(val);
    } else {
      problematicIndices.push(i);
    }
  }

  // Step 3: Replace with missing in ascending order
  // Missing are already sorted since we iterate 1 to 9 in validateFace
  const missing = [...diagnostic.missing];
  missing.sort((a, b) => a - b); // Ensure ascending just in case

  for (let i = 0; i < problematicIndices.length; i++) {
    const replaceIndex = problematicIndices[i];
    suggested[replaceIndex] = missing[i];
  }

  return {
    original: face,
    diagnostic,
    suggested
  };
}

export function solveCube(cube: CubeState): SolveCubeResult {
  const result: SolveCubeResult = { valid: true, faces: {} };
  
  if (!cube || !cube.faces) {
    return { valid: false, faces: {} };
  }

  for (const faceName of FACE_NAMES) {
    const faceData = cube.faces[faceName] || [];
    const solveResult = solveFace(faceData);
    result.faces[faceName] = solveResult;
    
    if (!solveResult.diagnostic.valid) {
      result.valid = false;
    }
  }

  return result;
}

export function rotateFace(face: any[], direction: 'clockwise' | 'counterclockwise'): FaceArray {
  if (!Array.isArray(face) || face.length !== 9) {
    throw new Error('Invalid face format for rotation');
  }

  const result = new Array(9);
  if (direction === 'clockwise') {
    result[0] = face[6]; result[1] = face[3]; result[2] = face[0];
    result[3] = face[7]; result[4] = face[4]; result[5] = face[1];
    result[6] = face[8]; result[7] = face[5]; result[8] = face[2];
  } else {
    result[0] = face[2]; result[1] = face[5]; result[2] = face[8];
    result[3] = face[1]; result[4] = face[4]; result[5] = face[7];
    result[6] = face[0]; result[7] = face[3]; result[8] = face[6];
  }
  return result;
}
