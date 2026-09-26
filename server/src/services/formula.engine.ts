import { Decimal } from 'decimal.js';

export type TokenType = 'NUMBER' | 'IDENTIFIER' | 'OPERATOR' | 'PAREN_LEFT' | 'PAREN_RIGHT';

export interface Token {
  type: TokenType;
  value: string;
}

export interface ASTNode {
  type: 'NumberLiteral' | 'Identifier' | 'BinaryExpression';
  value?: Decimal | string;
  operator?: string;
  left?: ASTNode;
  right?: ASTNode;
}

export class FormulaEngine {
  private variables: Map<string, Decimal> = new Map();

  constructor(variables: Record<string, any> = {}) {
    for (const [key, val] of Object.entries(variables)) {
      this.variables.set(key.toUpperCase(), new Decimal(val || 0));
    }
  }

  tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < expression.length) {
      const char = expression[i];
      if (/\s/.test(char)) {
        i++;
        continue;
      }
      if (/[+\-*/]/.test(char)) {
        tokens.push({ type: 'OPERATOR', value: char });
        i++;
        continue;
      }
      if (char === '(') {
        tokens.push({ type: 'PAREN_LEFT', value: '(' });
        i++;
        continue;
      }
      if (char === ')') {
        tokens.push({ type: 'PAREN_RIGHT', value: ')' });
        i++;
        continue;
      }
      if (/[a-zA-Z_]/.test(char)) {
        let id = '';
        while (i < expression.length && /[a-zA-Z0-9_]/.test(expression[i])) {
          id += expression[i];
          i++;
        }
        tokens.push({ type: 'IDENTIFIER', value: id.toUpperCase() });
        continue;
      }
      if (/[0-9.]/.test(char)) {
        let num = '';
        while (i < expression.length && /[0-9.]/.test(expression[i])) {
          num += expression[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: num });
        continue;
      }
      throw new Error(`Invalid character in formula: ${char}`);
    }
    return tokens;
  }

  parse(tokens: Token[]): ASTNode {
    let current = 0;

    function walk(): ASTNode {
      let token = tokens[current];
      if (token.type === 'NUMBER') {
        current++;
        return { type: 'NumberLiteral', value: new Decimal(token.value) };
      }
      if (token.type === 'IDENTIFIER') {
        current++;
        return { type: 'Identifier', value: token.value };
      }
      if (token.type === 'PAREN_LEFT') {
        current++;
        let node = parseExpression();
        token = tokens[current];
        if (!token || token.type !== 'PAREN_RIGHT') throw new Error('Missing closing parenthesis');
        current++;
        return node;
      }
      throw new Error(`Unexpected token: ${token.value}`);
    }

    function parseExpression(minPrecedence = 0): ASTNode {
      let left = walk();
      while (current < tokens.length && tokens[current].type === 'OPERATOR') {
        const op = tokens[current].value;
        const precedence = getPrecedence(op);
        if (precedence < minPrecedence) break;
        
        current++;
        const right = parseExpression(precedence + 1);
        left = {
          type: 'BinaryExpression',
          operator: op,
          left,
          right
        };
      }
      return left;
    }

    function getPrecedence(op: string): number {
      if (op === '+' || op === '-') return 1;
      if (op === '*' || op === '/') return 2;
      return 0;
    }

    const ast = parseExpression();
    if (current < tokens.length) {
      throw new Error('Unexpected tokens at the end of the expression');
    }
    return ast;
  }

  evaluateAST(node: ASTNode): Decimal {
    if (node.type === 'NumberLiteral') return node.value as Decimal;
    if (node.type === 'Identifier') {
      const id = node.value as string;
      if (id === 'CTC') return this.variables.get('CTC') || new Decimal(0);
      if (!this.variables.has(id)) throw new Error(`Missing dependency or value for identifier: ${id}`);
      return this.variables.get(id)!;
    }
    if (node.type === 'BinaryExpression') {
      const left = this.evaluateAST(node.left!);
      const right = this.evaluateAST(node.right!);
      switch (node.operator) {
        case '+': return left.plus(right);
        case '-': return left.minus(right);
        case '*': return left.times(right);
        case '/':
          if (right.isZero()) throw new Error('Division by zero');
          return left.dividedBy(right);
      }
    }
    throw new Error('Unknown AST node');
  }

  evaluate(expression: string): Decimal {
    const tokens = this.tokenize(expression);
    if (tokens.length === 0) return new Decimal(0);
    const ast = this.parse(tokens);
    // ROUND_HALF_UP behavior
    return this.evaluateAST(ast).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  extractDependencies(expression: string): string[] {
    const tokens = this.tokenize(expression);
    return [...new Set(tokens.filter(t => t.type === 'IDENTIFIER' && t.value !== 'CTC').map(t => t.value))];
  }
}
