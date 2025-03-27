export function normalizeExpression(rawExpr) {
  if (!rawExpr) return "";

  let expr = rawExpr;

  // Normalize variable case
  expr = expr.replace(/X/g, "x");

  // Step 1: Constants
  expr = expr.replace(/π|pi/gi, "PI");
  expr = expr.replace(/\be\b/g, "e");

  // Step 2: Function names (sinx → sin(x)), BEFORE anything gets broken
  const functions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan'];
  functions.forEach(fn => {
    const regex = new RegExp(`\\b${fn}(?!\\s*\\()\\s*([a-zA-Z0-9])`, 'g');
    expr = expr.replace(regex, `${fn}($1)`);
  });

  // Step 3: Insert * between:
  // number and variable/parenthesis (e.g., 2x, 3(x+1))
  expr = expr.replace(/(\d)([a-zA-Z(])/g, "$1*$2");
  // variable and number (e.g., x2 → x*2)
  expr = expr.replace(/([a-zA-Z])(\d)/g, "$1*$2");
  // variable and variable (e.g., ab → a*b), EXCEPT known function names
  expr = expr.replace(/([a-zA-Z])([a-zA-Z])/g, (match, p1, p2) => {
    const combined = `${p1}${p2}`;
    return functions.includes(combined.toLowerCase()) ? combined : `${p1}*${p2}`;
  });
  // closing paren and variable/number/open paren
  expr = expr.replace(/(\))([a-zA-Z(])/g, "$1*$2");

  // Step 4: Auto-close unbalanced parentheses
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (open > close) expr += ")".repeat(open - close);

  return expr;
}
