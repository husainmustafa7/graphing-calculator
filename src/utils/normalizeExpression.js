export function normalizeExpression(expr) {
  if (!expr) return "";

  // Remove all whitespace
  expr = expr.replace(/\s+/g, "");

  // Standardize case (optional: preserve user style)
  expr = expr.replace(/X/g, "x");
  expr = expr.replace(/Y/g, "y");

  // Step 1: Function shorthand: sinx → sin(x)
  const functions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan'];
  for (const fn of functions) {
    const regex = new RegExp(`\\b${fn}(?!\\()([a-zA-Z0-9])`, 'g');
    expr = expr.replace(regex, `${fn}($1)`);
  }

  // Step 2: Replace known constants
  expr = expr.replace(/π|pi/gi, "PI");
  expr = expr.replace(/\be\b/g, "e");

  // Step 3: Insert multiplication where needed
  expr = expr
    .replace(/(\d)([a-zA-Z(])/g, "$1*$2")     // 2x → 2*x, 3(x) → 3*(x)
    .replace(/([a-zA-Z])(\d)/g, "$1*$2")      // x2 → x*2
    .replace(/(\))([a-zA-Z(])/g, "$1*$2");    // )x → )*x

  // Step 4: Auto-close parentheses
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (open > close) expr += ")".repeat(open - close);

  return expr;
}
