export function normalizeExpression(rawExpr) {
  if (!rawExpr) return "";

  let expr = rawExpr;

  // Lowercase variables
  expr = expr.replace(/X/g, "x");

  // Step 1: Wrap shorthand functions like sinx → sin(x)
  const functions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan'];
  functions.forEach(fn => {
    const regex = new RegExp(`\\b${fn}\\s*([a-zA-Z0-9])`, 'g');
    expr = expr.replace(regex, `${fn}($1)`);
  });

  // Step 2: Replace constants
  expr = expr.replace(/π|pi/gi, "PI");
  expr = expr.replace(/\be\b/g, "e");

  // Step 3: Add * safely between:
  // number and variable or parenthesis
  expr = expr.replace(/(\d)([a-zA-Z(])/g, "$1*$2");
  // variable and number (e.g., x2 → x*2), NOT variable followed by (
  expr = expr.replace(/([a-zA-Z])(\d)/g, "$1*$2");
  // variable and variable (e.g., ab → a*b), avoid function names
  expr = expr.replace(/([a-z])([a-z])/gi, (match, p1, p2) => {
    const combo = `${p1}${p2}`;
    return functions.includes(combo.toLowerCase()) ? combo : `${p1}*${p2}`;
  });
  // ) and variable or number or (
  expr = expr.replace(/(\))([a-zA-Z(])/g, "$1*$2");

  // Step 4: Close parentheses if unbalanced
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (open > close) expr += ')'.repeat(open - close);

  return expr;
}
