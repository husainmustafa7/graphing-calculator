export function normalizeExpression(rawExpr) {
  if (!rawExpr) return "";

  let expr = rawExpr;

  // Lowercase all variables
  expr = expr.replace(/X/g, "x");

  // Step 1: Function shorthands like sinx → sin(x)
  const functions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan'];
  functions.forEach(fn => {
    const regex = new RegExp(`\\b${fn}\\s*([a-zA-Z0-9(])`, 'g');
    expr = expr.replace(regex, `${fn}($1`);
  });

  // Step 2: Constants
  expr = expr.replace(/π|pi/gi, "PI");
  expr = expr.replace(/\be\b/g, "e");

  // Step 3: Insert * safely (but don't mess with function names)
  // between number and variable or parentheses
  expr = expr.replace(/(\d)([a-zA-Z(])/g, "$1*$2");
  // between variable and number/variable/parenthesis
  expr = expr.replace(/([a-zA-Z])(\d|\()/g, "$1*$2");

  // between closing parenthesis and variable or number or open (
  expr = expr.replace(/(\))([a-zA-Z(])/g, "$1*$2");

  // Auto-close unbalanced parentheses
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (open > close) expr += ')'.repeat(open - close);

  return expr;
}
