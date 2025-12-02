import { toc } from '../../toc/toc.js';

/**
 * Collect all notes from the TOC tree with their properties
 * @returns {Array} Array of note objects with properties
 */
export function collectAllNotes() {
    const notes = [];

    function traverse(node, parentPath = '') {
        for (const [key, value] of Object.entries(node)) {
            if (key === '_meta' || key === 'index') continue;

            if (value.path) {
                // This is a note - extract its properties
                const notePath = parentPath ? `${parentPath}/${key}` : key;
                const noteData = {
                    'file.name': value.title || key,
                    'file.path': notePath,
                    'file.fullname': notePath,
                    'file.url': `/${notePath}`,
                    ...value // Include all frontmatter properties
                };

                // Remove internal properties
                delete noteData.path;

                notes.push(noteData);
            } else {
                // This is a folder - recurse
                const folderPath = parentPath ? `${parentPath}/${key}` : key;
                traverse(value, folderPath);
            }
        }
    }

    traverse(toc);
    return notes;
}

/**
 * Evaluate filter expression against a note
 * @param {Object} note - Note data object
 * @param {Object|Array|String} filter - Filter configuration
 * @returns {boolean} Whether the note passes the filter
 */
export function evaluateFilter(note, filter) {
    if (!filter) return true;

    // Handle array of filters (implicit AND)
    if (Array.isArray(filter)) {
        return filter.every(subFilter => evaluateFilter(note, subFilter));
    }

    // Handle 'and' operator
    if (filter.and) {
        return filter.and.every(subFilter => evaluateFilter(note, subFilter));
    }

    // Handle 'or' operator
    if (filter.or) {
        return filter.or.some(subFilter => evaluateFilter(note, subFilter));
    }

    // Handle string filter (e.g., "file.hasProperty('nostalgia_rating')")
    if (typeof filter === 'string') {
        return evaluateFilterString(note, filter);
    }

    // Handle object filter (property comparisons)
    for (const [key, value] of Object.entries(filter)) {
        if (note[key] !== value) {
            return false;
        }
    }

    return true;
}

/**
 * Evaluate a filter string expression
 * @param {Object} note - Note data object
 * @param {String} filterStr - Filter string like "file.hasProperty('rating')"
 * @returns {boolean}
 */
function evaluateFilterString(note, filterStr) {
    // Handle file.hasProperty(property)
    const hasPropertyMatch = filterStr.match(/file\.hasProperty\(['"](.+?)['"]\)/);
    if (hasPropertyMatch) {
        const property = hasPropertyMatch[1];
        return note[property] !== undefined && note[property] !== null && note[property] !== '';
    }

    // Handle file property string operations
    const fileOperations = [
        { regex: /file\.fullname\.(startsWith|endsWith|includes|contains)\(['"](.+?)['"]\)/, prop: 'file.fullname' },
        { regex: /file\.name\.(startsWith|endsWith|includes|contains)\(['"](.+?)['"]\)/, prop: 'file.name' },
        { regex: /file\.path\.(startsWith|endsWith|includes|contains)\(['"](.+?)['"]\)/, prop: 'file.path' }
    ];

    for (const op of fileOperations) {
        const match = filterStr.match(op.regex);
        if (match) {
            const method = match[1] === 'contains' ? 'includes' : match[1];
            const searchStr = match[2];
            const value = note[op.prop] || '';
            return String(value)[method](searchStr);
        }
    }

    // Handle general property string operations
    const stringOpMatch = filterStr.match(/(\w+)\.(startsWith|endsWith|includes|contains)\(['"](.+?)['"]\)/);
    if (stringOpMatch) {
        const property = stringOpMatch[1];
        const method = stringOpMatch[2] === 'contains' ? 'includes' : stringOpMatch[2];
        const searchStr = stringOpMatch[3];
        const value = note[property] || '';
        return String(value)[method](searchStr);
    }

    // Handle comparison expressions with enhanced operators
    const comparisonPattern = /^(.+?)\s*([><=!]+|!==|===|!=|==|contains|includes|startsWith|endsWith)\s*(.+)$/;
    const compMatch = filterStr.match(comparisonPattern);

    if (compMatch) {
        const leftSide = compMatch[1].trim();
        const operator = compMatch[2].trim();
        const rightSide = compMatch[3].trim();

        const leftValue = evaluatePropertyOrLiteral(note, leftSide);
        const rightValue = evaluatePropertyOrLiteral(note, rightSide);

        return compareValues(leftValue, operator, rightValue);
    }

    // Handle property existence checks
    const propertyMatch = filterStr.match(/^(\w+)$/);
    if (propertyMatch) {
        return note[filterStr] !== undefined && note[filterStr] !== null;
    }

    // Handle complex expressions (fallback)
    try {
        return evaluateComplexExpression(note, filterStr);
    } catch (e) {
        console.warn('Filter evaluation failed:', filterStr, e);
        return false;
    }
}

/**
 * Evaluate property reference or literal value
 * @param {Object} note - Note data
 * @param {String} expr - Expression to evaluate
 * @returns {*} Evaluated value
 */
function evaluatePropertyOrLiteral(note, expr) {
    expr = expr.trim();

    // Handle string literals
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
        return expr.slice(1, -1);
    }

    // Handle number literals
    if (/^-?\d+(\.\d+)?$/.test(expr)) {
        return parseFloat(expr);
    }

    // Handle boolean literals
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;

    // Handle property references
    if (Object.prototype.hasOwnProperty.call(note, expr)) {
        return note[expr];
    }

    // Handle arithmetic expressions
    if (/[+\-*/]/.test(expr)) {
        try {
            return evaluateFormula(note, expr);
        } catch {
            return 0;
        }
    }

    return expr;
}

/**
 * Compare two values using the given operator
 * @param {*} left - Left value
 * @param {String} operator - Comparison operator
 * @param {*} right - Right value
 * @returns {boolean} Comparison result
 */
function compareValues(left, operator, right) {
    // Handle null/undefined cases
    if (left == null || right == null) {
        return operator === '==' ? left == right : operator === '!=' ? left != right : false;
    }

    switch (operator) {
        case '>': return Number(left) > Number(right);
        case '>=': return Number(left) >= Number(right);
        case '<': return Number(left) < Number(right);
        case '<=': return Number(left) <= Number(right);
        case '==': return left == right;
        case '===': return left === right;
        case '!=': return left != right;
        case '!==': return left !== right;
        case 'contains': case 'includes': return String(left).toLowerCase().includes(String(right).toLowerCase());
        case 'startsWith': return String(left).toLowerCase().startsWith(String(right).toLowerCase());
        case 'endsWith': return String(left).toLowerCase().endsWith(String(right).toLowerCase());
        default: return false;
    }
}

/**
 * Evaluate complex expressions with JavaScript evaluation
 * @param {Object} note - Note data
 * @param {String} expr - Expression to evaluate
 * @returns {boolean} Evaluation result
 */
function evaluateComplexExpression(note, expr) {
    // Handle Obsidian-specific expressions first
    let expression = expr;

    // Handle .isEmpty() method calls
    expression = expression.replace(/(\w+)\.isEmpty\(\)/g, (match, prop) => {
        const value = note[prop];
        const isEmpty = !value || value === '' || (Array.isArray(value) && value.length === 0);
        return isEmpty;
    });

    // Handle file.ext property
    if (expression.includes('file.ext')) {
        const filePath = note['file.path'] || note['file.fullname'] || '';
        const ext = filePath.split('.').pop() || '';
        expression = expression.replace(/file\.ext/g, `"${ext}"`);
    }

    // Replace property references with actual values
    const properties = expression.match(/\b[a-zA-Z_]\w*\b/g) || [];
    const keywords = ['true', 'false', 'null', 'undefined', 'Math', 'Number', 'Date', 'parseInt', 'parseFloat'];

    for (const prop of properties) {
        if (keywords.includes(prop)) continue;

        if (Object.prototype.hasOwnProperty.call(note, prop)) {
            const value = note[prop];
            if (typeof value === 'string') {
                expression = expression.replace(new RegExp(`\\b${prop}\\b`, 'g'), `"${value.replace(/"/g, '\\"')}"`);
            } else if (typeof value === 'number') {
                expression = expression.replace(new RegExp(`\\b${prop}\\b`, 'g'), String(value));
            } else {
                expression = expression.replace(new RegExp(`\\b${prop}\\b`, 'g'), JSON.stringify(value));
            }
        } else {
            // Replace undefined properties with null
            expression = expression.replace(new RegExp(`\\b${prop}\\b`, 'g'), 'null');
        }
    }

    // Safely evaluate expression
    return Function(`"use strict"; return (${expression})`)();
}

/**
 * Evaluate a formula expression
 * @param {Object} note - Note data object
 * @param {String} formula - Formula expression
 * @returns {number|null}
 */
export function evaluateFormula(note, formula) {
    try {
        // Replace property references with values
        let expression = formula;

        // Enhanced function support
        const functions = {
            'today()': () => Date.now(),
            'now()': () => Date.now(),
            'year(': (dateExpr) => new Date(dateExpr).getFullYear(),
            'month(': (dateExpr) => new Date(dateExpr).getMonth() + 1,
            'day(': (dateExpr) => new Date(dateExpr).getDate(),
            'abs(': (x) => Math.abs(x),
            'round(': (x) => Math.round(x),
            'floor(': (x) => Math.floor(x),
            'ceil(': (x) => Math.ceil(x),
            'min(': (...args) => Math.min(...args),
            'max(': (...args) => Math.max(...args),
            'sqrt(': (x) => Math.sqrt(x)
        };

        // Replace function calls
        for (const [funcName, func] of Object.entries(functions)) {
            if (expression.includes(funcName)) {
                if (funcName.endsWith('()')) {
                    expression = expression.replace(new RegExp(funcName.replace('()', '\\(\\)'), 'g'), func());
                }
                // For functions with parameters, we'll handle them in the main evaluation
            }
        }

        // Find all property references (alphanumeric + underscore)
        const properties = formula.match(/\b[a-zA-Z_]\w*\b/g) || [];
        const keywords = ['Math', 'Number', 'parseInt', 'parseFloat', 'Date', 'abs', 'round', 'floor', 'ceil', 'min', 'max', 'sqrt'];

        for (const prop of properties) {
            // Skip JavaScript keywords and Math functions
            if (keywords.includes(prop)) continue;

            const value = note[prop];
            if (value === undefined || value === null || value === '') {
                return null; // Can't compute if missing data
            }

            // Convert to number if possible, otherwise keep as is for string operations
            const numValue = Number(value);
            if (!isNaN(numValue)) {
                expression = expression.replace(new RegExp(`\\b${prop}\\b`, 'g'), numValue);
            } else if (typeof value === 'string') {
                // Handle string values in formulas (for length, etc.)
                expression = expression.replace(new RegExp(`\\b${prop}\\b`, 'g'), `"${value.replace(/"/g, '\\"')}"`);
            }
        }

        // Handle special formula patterns
        expression = expression.replace(/\.length/g, '.length');
        expression = expression.replace(/\.split\(/g, '.split(');

        // Evaluate the expression safely
        const result = Function(`
            "use strict";
            const Math = globalThis.Math;
            const abs = Math.abs;
            const round = Math.round;
            const floor = Math.floor;
            const ceil = Math.ceil;
            const min = Math.min;
            const max = Math.max;
            const sqrt = Math.sqrt;
            return (${expression});
        `)();

        return typeof result === 'number' && !isNaN(result) ? result : null;
    } catch (e) {
        console.error('Formula evaluation error:', e);
        return null;
    }
}

/**
 * Process notes with filters and formulas
 * @param {Object} config - Data table configuration (filters, formulas, views)
 * @returns {Array} Processed notes with formula columns
 */
export function processDataTable(config) {
    // Collect all notes
    let notes = collectAllNotes();

    // Apply filters
    if (config.filters) {
        notes = notes.filter(note => evaluateFilter(note, config.filters));
    }

    // Evaluate formulas
    if (config.formulas) {
        notes = notes.map(note => {
            const formulaResults = {};

            // Handle formulas as array (from .base files)
            if (Array.isArray(config.formulas)) {
                for (const formula of config.formulas) {
                    const cleanExpr = formula.formula.replace(/^\|\+\s*/, '').trim();
                    formulaResults[`formula.${formula.name}`] = evaluateFormula(note, cleanExpr);
                }
            } else {
                // Handle formulas as object (old format)
                for (const [formulaName, formulaExpr] of Object.entries(config.formulas)) {
                    const cleanExpr = formulaExpr.replace(/^\|\+\s*/, '').trim();
                    formulaResults[`formula.${formulaName}`] = evaluateFormula(note, cleanExpr);
                }
            }

            return { ...note, ...formulaResults };
        });
    }

    return notes;
}

/**
 * Apply view configuration (filters, sort, order columns)
 * @param {Array} notes - Processed notes
 * @param {Object} view - View configuration
 * @returns {Object} { columns, data }
 */
export function applyView(notes, view) {
    let data = [...notes];

    // Apply view-specific filters
    if (view.filters) {
        data = data.filter(note => evaluateFilter(note, view.filters));
    }

    // Apply sorting
    if (view.sort && view.sort.length > 0) {
        data.sort((a, b) => {
            for (const sortRule of view.sort) {
                const { property, direction } = sortRule;
                const aVal = a[property];
                const bVal = b[property];

                // Handle null/undefined
                if (aVal == null && bVal == null) continue;
                if (aVal == null) return direction === 'ASC' ? 1 : -1;
                if (bVal == null) return direction === 'ASC' ? -1 : 1;

                // Compare values
                let comparison = 0;
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    comparison = aVal - bVal;
                } else {
                    comparison = String(aVal).localeCompare(String(bVal));
                }

                if (comparison !== 0) {
                    return direction === 'ASC' ? comparison : -comparison;
                }
            }
            return 0;
        });
    }

    // Apply grouping
    let groupedData = data;
    let summaryData = {};

    if (view.groupBy) {
        const { property, direction = 'ASC' } = view.groupBy;

        // Group data by property
        const groups = {};
        data.forEach(item => {
            const groupValue = item[property] || 'Ungrouped';
            if (!groups[groupValue]) {
                groups[groupValue] = [];
            }
            groups[groupValue].push(item);
        });

        // Sort group keys
        const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
            const comparison = String(a).localeCompare(String(b));
            return direction === 'ASC' ? comparison : -comparison;
        });

        // Flatten groups back to array with group headers
        groupedData = [];
        sortedGroupKeys.forEach(groupKey => {
            // Add group header
            const groupHeader = { __isGroupHeader: true, __groupKey: groupKey, [property]: groupKey };
            groupedData.push(groupHeader);

            // Add group items
            groupedData.push(...groups[groupKey]);
        });

        // Calculate summaries if specified
        if (view.summaries) {
            Object.entries(view.summaries).forEach(([column, aggregation]) => {
                sortedGroupKeys.forEach(groupKey => {
                    const groupItems = groups[groupKey];
                    const values = groupItems.map(item => item[column]).filter(val => typeof val === 'number');

                    let result = null;
                    if (values.length > 0) {
                        switch (aggregation.toLowerCase()) {
                            case 'average':
                            case 'avg':
                                result = values.reduce((sum, val) => sum + val, 0) / values.length;
                                break;
                            case 'sum':
                                result = values.reduce((sum, val) => sum + val, 0);
                                break;
                            case 'count':
                                result = values.length;
                                break;
                            case 'min':
                                result = Math.min(...values);
                                break;
                            case 'max':
                                result = Math.max(...values);
                                break;
                        }
                    }

                    if (!summaryData[groupKey]) summaryData[groupKey] = {};
                    summaryData[groupKey][column] = result;
                });
            });
        }
    }

    // Define column order from order field (Obsidian uses 'order' not 'properties')
    const columns = view.order || view.properties || Object.keys(data[0] || {});

    return {
        columns,
        data: groupedData,
        summaries: summaryData,
        viewType: view.type || 'table',
        groupBy: view.groupBy,
        indentProperties: view.indentProperties
    };
}
