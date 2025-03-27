export function normalizeExpression(rawExpr) {
  if (!rawExpr) return "";

  let expr = rawExpr;

  // Normalize variable case
  expr = expr.replace(/X/g, "x");

  // Step 1: Constants
  expr = expr.replace(/π|pi/gi, "PI");
  expr = expr.replace(/\be\b/g, "e");

  // Step 2: Function names like sinx → sin(x)
  const functions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan'];
  functions.forEach(fn => {
    // match sinx, sin 2x, sin(x) should be untouched
    const regex = new RegExp(`\\b${fn}(?!\\s*\\()\\s*([a-zA-Z0-9])`, 'g');
    expr = expr.replace(regex, `${fn}($1)`);
  });

  // Step 3: Multiply between number and variable or parenthesis (2x, 2(x))
  expr = expr.replace(/(\d)([a-zA-Z(])/g, "$1*$2");

  // Multiply between variable and number (x2 → x*2)
  expr = expr.replace(/([a-zA-Z])(\d)/g, "$1*$2");

  // Multiply between variable and variable (but skip known functions)
  expr = expr.replace(/([a-zA-Z])([a-zA-Z])/g, (match, p1, p2) => {
    const fnGuess = `${p1}${p2}`.toLowerCase();
    return functions.includes(fnGuess) ? `${p1}${p2}` : `${p1}*${p2}`;
  });

  // Multiply between ) and variable or (
  expr = expr.replace(/(\))([a-zA-Z(])/g, "$1*$2");

  // Auto-close unbalanced parentheses
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (open > close) expr += ')'.repeat(open - close);

  return expr;
}
