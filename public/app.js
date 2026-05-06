const FACES = ['U', 'D', 'F', 'B', 'L', 'R'];
const API_BASE = '/api/sudokube';

const btnLoadValid = document.getElementById('btn-load-valid');
const btnLoadInvalid = document.getElementById('btn-load-invalid');
const btnValidate = document.getElementById('btn-validate');
const btnSolve = document.getElementById('btn-solve');
const diagnosticContent = document.getElementById('diagnostic-content');

// Generate grid inputs
FACES.forEach(face => {
    const grid = document.getElementById(`face-${face}`);
    for (let i = 0; i < 9; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.max = '9';
        input.className = 'cell-input';
        input.dataset.face = face;
        input.dataset.index = i;
        grid.appendChild(input);
    }
});

// Build state from DOM
function getCurrentState() {
    const state = { faces: {} };
    FACES.forEach(face => {
        const inputs = document.querySelectorAll(`.cell-input[data-face="${face}"]`);
        state.faces[face] = Array.from(inputs).map(input => {
            const val = parseInt(input.value, 10);
            return isNaN(val) ? null : val;
        });
    });
    return state;
}

// Update DOM from state
function updateDOMState(state, changes = null) {
    FACES.forEach(face => {
        if (!state.faces[face]) return;
        const inputs = document.querySelectorAll(`.cell-input[data-face="${face}"]`);
        state.faces[face].forEach((val, i) => {
            const currentVal = inputs[i].value;
            inputs[i].value = val === null || val === undefined ? '' : val;
            
            // Remove old classes
            inputs[i].classList.remove('valid', 'invalid', 'changed');
            
            // If we have changes object, highlight what was changed
            if (changes && changes[face] && currentVal !== '' && parseInt(currentVal, 10) !== val) {
                inputs[i].classList.add('changed');
            }
        });
    });
}

// Clear all classes
function clearClasses() {
    document.querySelectorAll('.cell-input').forEach(input => {
        input.classList.remove('valid', 'invalid', 'changed');
    });
}

// Render diagnostic
function renderDiagnostic(data) {
    clearClasses();
    
    if (data.valid) {
        diagnosticContent.innerHTML = `<span class="diag-success">¡El Sudoku-Cubo es completamente válido!</span>`;
        document.querySelectorAll('.cell-input').forEach(input => input.classList.add('valid'));
        return;
    }

    let html = `<span class="diag-error">El Sudoku-Cubo contiene errores:</span><br><br>`;
    
    FACES.forEach(face => {
        const faceDiag = data.faces[face];
        if (!faceDiag.valid) {
            html += `<div class="diag-face-err"><strong>Cara ${face}:</strong><br>`;
            
            if (faceDiag.invalidPositions.length > 0) {
                html += `- Posiciones vacías o inválidas detectadas.<br>`;
                faceDiag.invalidPositions.forEach(idx => {
                    document.querySelector(`.cell-input[data-face="${face}"][data-index="${idx}"]`).classList.add('invalid');
                });
            }
            if (faceDiag.duplicates.length > 0) {
                html += `- Números duplicados: ${faceDiag.duplicates.join(', ')}.<br>`;
                // Find and mark duplicates in UI
                const inputs = document.querySelectorAll(`.cell-input[data-face="${face}"]`);
                const vals = Array.from(inputs).map(i => parseInt(i.value, 10));
                vals.forEach((v, idx) => {
                    if (faceDiag.duplicates.includes(v)) {
                        inputs[idx].classList.add('invalid');
                    }
                });
            }
            if (faceDiag.missing.length > 0) {
                html += `- Números faltantes: ${faceDiag.missing.join(', ')}.<br>`;
            }
            html += `</div>`;
        } else {
            // Mark valid face inputs
            document.querySelectorAll(`.cell-input[data-face="${face}"]`).forEach(i => i.classList.add('valid'));
        }
    });

    diagnosticContent.innerHTML = html;
}

// Load Valid Example
btnLoadValid.addEventListener('click', () => {
    const validState = { faces: {} };
    FACES.forEach(face => {
        validState.faces[face] = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // Simple valid face
    });
    updateDOMState(validState);
    diagnosticContent.innerHTML = "Ejemplo válido cargado. Haz clic en Validar.";
    clearClasses();
});

// Load Invalid Example
btnLoadInvalid.addEventListener('click', () => {
    const invalidState = { faces: {} };
    // Mix of valid, duplicate, invalid and empty
    invalidState.faces['U'] = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // Valid
    invalidState.faces['D'] = [1, 1, 3, 4, 5, 6, 7, 8, 9]; // Duplicate 1, Missing 2
    invalidState.faces['F'] = [9, 8, 7, 6, 5, 4, 3, 2, 1]; // Valid
    invalidState.faces['B'] = [1, 2, 3, 4, null, 6, 7, 8, 9]; // Missing 5
    invalidState.faces['L'] = [10, 2, 3, 4, 5, 6, 7, 8, 9]; // Invalid 10
    invalidState.faces['R'] = [1, 2, 2, 4, 5, 6, 7, 8, 8]; // Multiple issues
    
    updateDOMState(invalidState);
    diagnosticContent.innerHTML = "Ejemplo inválido cargado. Haz clic en Validar o Sugerir Corrección.";
    clearClasses();
});

// Validate
btnValidate.addEventListener('click', async () => {
    try {
        const state = getCurrentState();
        const res = await fetch(`${API_BASE}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        });
        const data = await res.json();
        renderDiagnostic(data);
    } catch (err) {
        diagnosticContent.innerHTML = `<span class="diag-error">Error de red al conectar con el servidor.</span>`;
    }
});

// Solve
btnSolve.addEventListener('click', async () => {
    try {
        const state = getCurrentState();
        const res = await fetch(`${API_BASE}/solve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        });
        const data = await res.json();
        
        // Construct new state from suggestions
        const suggestedState = { faces: {} };
        const changes = {};
        
        FACES.forEach(face => {
            suggestedState.faces[face] = data.faces[face].suggested;
            changes[face] = true; // Mark to check for changes
        });
        
        updateDOMState(suggestedState, changes);
        diagnosticContent.innerHTML = `<span class="diag-success">Corrección determinística aplicada. Los valores modificados están resaltados.</span>`;
    } catch (err) {
        diagnosticContent.innerHTML = `<span class="diag-error">Error al solicitar solución.</span>`;
    }
});

// Rotate Face
document.querySelectorAll('.rotate-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const face = e.target.dataset.face;
        const dir = e.target.dataset.dir;
        
        try {
            const state = getCurrentState();
            const res = await fetch(`${API_BASE}/rotate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ face, direction: dir, state })
            });
            const data = await res.json();
            
            if (data.error) {
                diagnosticContent.innerHTML = `<span class="diag-error">${data.error}</span>`;
                return;
            }
            
            updateDOMState(data.newState);
            clearClasses();
            diagnosticContent.innerHTML = `Cara ${face} rotada en sentido ${dir === 'clockwise' ? 'horario' : 'antihorario'}.`;
        } catch (err) {
            diagnosticContent.innerHTML = `<span class="diag-error">Error al rotar.</span>`;
        }
    });
});
