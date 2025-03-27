export function normalizeExpression(rawExpr) {
    if (!rawExpr) return "";
  
    let expr = rawExpr;
  
    // Normalize X to lowercase x
    expr = expr.replace(/X/g, "x");
  
    // Replace π and pi (case-insensitive) with PI
    expr = expr.replace(/π|pi/gi, "PI");
  
    // Avoid replacing variable 'e' unless it's standalone
    // (we keep it as 'e' since mathjs supports it)
    expr = expr.replace(/\be\b/g, "e");
  
    // Add * between number and variable (2x → 2*x)
    expr = expr.replace(/(\d)(x)/g, "$1*$2");
  
    // Add * between variable and variable (ax → a*x)
    expr = expr.replace(/([a-zA-Z])([a-zA-Z])/g, "$1*$2");
  
    // Add * between number and parentheses (2(x) → 2*(x))
    expr = expr.replace(/(\d)\s*(\()/g, "$1*$2");
  
    // Add * between variable and parentheses (x(x) → x*(x))
    expr = expr.replace(/([a-zA-Z])\s*(\()/g, "$1*$2");
  
    // Add * between closing parenthesis and variable (()x → ()*x)
    expr = expr.replace(/(\))\s*([a-zA-Z])/g, "$1*$2");
  
    // Add * between closing parenthesis and opening parenthesis (()() → ()*())
    expr = expr.replace(/(\))\s*(\()/g, "$1*$2");
  
    // Auto-wrap function calls like sinx → sin(x)
    const functions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan'];
    functions.forEach(fn => {
      const regex = new RegExp(`\\b${fn}([a-zA-Z0-9(])`, 'g');
      expr = expr.replace(regex, `${fn}($1`);
    });
  
    // Auto-close unbalanced parentheses
    const openCount = (expr.match(/\(/g) || []).length;
    const closeCount = (expr.match(/\)/g) || []).length;
    const missing = openCount - closeCount;
    if (missing > 0) {
      expr += ')'.repeat(missing);
    }
  
    return expr;
  }
  