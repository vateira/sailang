import { cmd, Node, NodeKind, NodeValue } from "./ast.ts";
import { LangError } from "./error.ts";
export type TokenKind =
  | "OP"
  | "NUM"
  | "PAREN"
  | "PAREN"
  | "IDENT"
  | "SYMBOL"
  | "KEYWORD";

export type Token = [TokenKind, string, number];

export const parse = function (tokens: Token[]): Node {
  const parser = new Parser(tokens);
  return parser.parse();
};

export class Parser {
  private tokens: Token[];
  private node: Node | null;
  private cache: (Token[])[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.node = null;
    this.cache = [];
  }

  parse(): Node {
    return this.eStmts();
  }

  private stash() {
    this.cache.push([...this.tokens]);
  }

  private pop(): Token[] {
    return this.cache.pop()!;
  }

  private consume(kind: TokenKind, values?: string[]): Token {
    const head = this.tokens.shift()!;

    if (head[0] != kind) {
      throw this.err(`should be a ${kind}`, head);
    }
    if (values != null && !values.includes(head[1])) {
      throw this.err(`should be one of ${values.join(", ")}`, head);
    }
    return head;
  }

  private seek(): Token {
    return this.tokens[0];
  }

  private isNext(kind: TokenKind, values?: string[]): boolean {
    if (this.tokens.length != 0) {
      const [k, v] = this.seek();
      return k == kind && (values?.includes(v) ?? true);
    } else {
      return false;
    }
  }

  // statements := {<statement> ";"}
  private eStmts(): Node {
    let stmts: Node[] = [];
    while (this.tokens.length > 0) {
      stmts.push(this.eStmt());
      if (this.isNext("SYMBOL", [";"])) {
        this.consume("SYMBOL", [";"]);
      } else {
        break;
      }
    }
    return cmd("STATEMENTS", stmts[0].position, "", stmts);
  }

  // stamtement := <ident> {<exp>} | <exp>
  private eStmt(): Node {
    if (this.isNext("IDENT")) {
      const ident = this.seek();
      switch (ident[1]) {
        case "print":
          this.consume("IDENT");
          const e = this.eExp();
          return cmd("CALL", ident[2], "print", [e]);
        case "let":
          this.consume("IDENT");
          const v = this.consume("IDENT");
          this.consume("OP", [":="]);
          const e2 = this.eExp();
          return cmd("ASSIGN", v[2], v[1], [e2]);
        default:
          return this.eFactor();
      }
    } else if (this.isNext("KEYWORD")) {
      const keyword = this.consume("KEYWORD");
      switch (keyword[1]) {
        case "let":
          const v = this.consume("IDENT");
          this.consume("OP", [":="]);
          const e2 = this.eExp();
          return cmd("ASSIGN", v[2], v[1], [e2]);
        default:
          throw this.err(`is an unexcepted keyword.`, keyword);
      }
    } else {
      return this.eExp();
    }
  }

  // exp := <term> {"+" <term>}
  private eExp(): Node {
    if (this.isNext("SYMBOL", ["\\"])) {
      return this.eLambda();
    } else if (this.isNext("KEYWORD", ["if"])) {
      return this.eConditional();
    } else {
      return this.eEquality();
    }
  }

  private eConditional(): Node {
    this.consume("KEYWORD", ["if"]);
    const cond = this.eEquality();
    this.consume("KEYWORD", ["then"]);
    const positive = this.eExp();
    this.consume("KEYWORD", ["else"]);
    const negative = this.eExp();
    return cmd("COND", cond.position, null, [cond, positive, negative]);
  }

  private eLambda() {
    const sym = this.consume("SYMBOL");
    let args = [];

    while (this.isNext("IDENT")) {
      args.push(this.consume("IDENT"));
    }

    this.consume("OP", ["->"]);

    let exp = this.eExp();

    return cmd("LAMBDA", sym[2], args.map((x) => x[1]), [exp]);
  }

  private eEquality(): Node {
    var lhs = this.eRelational();
    if (this.isNext("OP", ["=", "!="])) {
      const op = this.consume("OP");
      const rhs = this.eRelational();
      lhs = cmd("OP", op[2], op[1], [lhs, rhs]);
    }
    return lhs;
  }

  private eRelational(): Node {
    var lhs = this.eAddSub();
    if (this.isNext("OP", [">", "<", ">=", "<="])) {
      const op = this.consume("OP");
      const rhs = this.eAddSub();
      lhs = cmd("OP", op[2], op[1], [lhs, rhs]);
    }
    return lhs;
  }

  private eAddSub() {
    var lhs = this.eTerm();
    while (this.isNext("OP", ["+", "-"])) {
      const op = this.consume("OP");
      const rhs = this.eTerm();
      lhs = cmd("OP", op[2], op[1], [lhs, rhs]);
    }
    return lhs;
  }

  // term := <factor> {"*" <term>}
  private eTerm(): Node {
    var lhs = this.eFactor();
    while (this.isNext("OP", ["*", "/"])) {
      const op = this.consume("OP");
      const rhs = this.eFactor();
      lhs = cmd("OP", op[2], op[1], [lhs, rhs]);
    }
    return lhs;
  }

  // factor := "(" <exp> ")" | <ident> | <num>
  private eFactor(): Node {
    if (this.isNext("PAREN", ["("])) {
      this.consume("PAREN", ["("]);
      const exp = this.eExp();
      this.consume("PAREN", [")"]);
      return exp;
    } else if (this.isNext("PAREN", ["{"])) {
      this.consume("PAREN", ["{"]);
      const stmts = this.eStmts();
      this.consume("PAREN", ["}"]);
      return stmts;
    } else if (this.isNext("IDENT")) {
      const ident = this.consume("IDENT");
      let args = [];
      try {
        while (!this.isNext("SYMBOL", [";"])) {
          this.stash();
          const expr = this.eExp();
          args.push(expr);
          this.pop();
        }
      } catch {
        this.tokens = this.pop();
      }
      const arity = args.length;
      if (arity == 0) {
        return cmd("REF", ident[2], ident[1]);
      } else {
        return cmd("CALL", ident[2], ident[1], args);
      }
    } else {
      return this.eNumVal();
    }
  }

  private eNumVal(): Node {
    const [_, v, i] = this.consume("NUM");
    return cmd("VALUE", i, parseInt(v));
  }

  private err(message: string, token?: Token): LangError {
    const [k, v, i] = token ?? this.seek();
    return {
      message: `"${v}(${k})" ${message} (at)`,
      position: i,
    };
  }
}
