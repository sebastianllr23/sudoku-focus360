import { test } from 'node:test';
import assert from 'node:assert';
import { validateFace, validateCube, solveFace, rotateFace, CubeState } from '../src/sudokube';

test('1. Estado completamente válido retorna valid: true', () => {
    const validFace = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const validCube: CubeState = {
        faces: {
            U: [...validFace],
            D: [...validFace],
            F: [...validFace],
            B: [...validFace],
            L: [...validFace],
            R: [...validFace]
        }
    };
    
    const result = validateCube(validCube);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.faces['F'].valid, true);
});

test('2. Cara con número duplicado informa duplicado y faltante', () => {
    // 5 is duplicate, 9 is missing
    const invalidFace = [1, 2, 3, 4, 5, 6, 7, 8, 5];
    const result = validateFace(invalidFace);
    
    assert.strictEqual(result.valid, false);
    assert.deepStrictEqual(result.duplicates, [5]);
    assert.deepStrictEqual(result.missing, [9]);
});

test('3. Cara con valor fuera de rango informa posición inválida', () => {
    // 10 is out of range, at index 8
    const invalidFace = [1, 2, 3, 4, 5, 6, 7, 8, 10];
    const result = validateFace(invalidFace);
    
    assert.strictEqual(result.valid, false);
    assert.deepStrictEqual(result.invalidPositions, [8]);
    assert.deepStrictEqual(result.missing, [9]);
});

test('4. Entrada incompleta o mal formada retorna error controlado', () => {
    // @ts-ignore
    const resultFace = validateFace([1, 2]); // Not length 9
    assert.strictEqual(resultFace.valid, false);
    assert.strictEqual(resultFace.invalidPositions.length, 2); // 0, 1 mapped as invalid, wait logic maps lengths.
    // the logic in sudokube.ts returns all positions 0..N if length !== 9
    assert.deepStrictEqual(resultFace.invalidPositions, [0, 1]);
    
    // @ts-ignore
    const resultCube = validateCube({}); // Missing faces
    assert.strictEqual(resultCube.valid, false);
});

test('5. Rotación horaria de una cara transforma correctamente la matriz 3x3', () => {
    const original = [
        1, 2, 3,
        4, 5, 6,
        7, 8, 9
    ];
    const expectedClockwise = [
        7, 4, 1,
        8, 5, 2,
        9, 6, 3
    ];
    const rotated = rotateFace(original, 'clockwise');
    assert.deepStrictEqual(rotated, expectedClockwise);
});

test('5b. Rotación antihoraria transforma correctamente', () => {
    const original = [
        1, 2, 3,
        4, 5, 6,
        7, 8, 9
    ];
    const expectedCounter = [
        3, 6, 9,
        2, 5, 8,
        1, 4, 7
    ];
    const rotated = rotateFace(original, 'counterclockwise');
    assert.deepStrictEqual(rotated, expectedCounter);
});

test('6. solveFace devuelve un estado sugerido válido para una cara corregible', () => {
    // Face with missing numbers, duplicates, and out of bounds
    // Duplicates: 2 (indices 1, 8), Missing: 8, 9
    // Out of bounds: 10 (index 2)
    const corruptFace = [1, 2, 10, 4, 5, 6, 7, null, 2];
    const result = solveFace(corruptFace);
    
    assert.strictEqual(result.diagnostic.valid, false);
    
    // Check if suggested state is perfectly valid
    const validationOfSuggested = validateFace(result.suggested);
    assert.strictEqual(validationOfSuggested.valid, true);
    
    // Check deterministic rule: keep first appearances
    // The first valid are: 1, 2, _, 4, 5, 6, 7, _, _
    // Missing are: 3, 8, 9 (since 10 is invalid and 2 is duplicate, and null is invalid)
    // Actually, in corruptFace: 1, 2 (keep), 10 (invalid -> 3), 4, 5, 6, 7, null (invalid -> 8), 2 (dup -> 9)
    assert.deepStrictEqual(result.suggested, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});
