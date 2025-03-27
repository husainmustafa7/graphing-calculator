export function normalizeExpression(rawExpr) {
  if (!rawExpr) return "";

  let expr = rawExpr;

  // Normalize uppercase X to x
  expr = expr.replace(/X/g, "x");

  // Step 1: Replace constants
  expr = expr.replace(/π|pi/gi, "PI");
  expr = expr.replace(/\be\b/g, "e");

  // Step 2: Handle function shorthand (sinx → sin(x))
  const functions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan'];
  functions.forEach(fn => {
    const regex = new RegExp(`\\b${fn}(?!\\s*\\()\\s*([a-zA-Z0-9(])`, 'g');
    expr = expr.replace(regex, `${fn}($1`);
  });

  // Step 3: Add * between number and variable or parenthesis (2x, 3(x))
  expr = expr.replace(/(\d)([a-zA-Z(])/g, "$1*$2");

  // Step 4: Add * between variable and number (x2 → x*2)
  expr = expr.replace(/([a-zA-Z])(\d)/g, "$1*$2");

  // Step 5: Add * between variable and variable if not part of function name
  expr = expr.replace(/([a-zA-Z])([a-zA-Z])/g, (match, p1, p2) => {
    const combo = `${p1}${p2}`.toLowerCase();
    return functions.includes(combo) ? match : `${p1}*${p2}`;
  });

  // Step 6: Add * between ) and variable or (
  expr = expr.replace(/(\))([a-zA-Z(])/g, "$1*$2");

  // Step 7: Auto-close unmatched parentheses
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (open > close) expr += ")".repeat(open - close);

  return expr;
}
