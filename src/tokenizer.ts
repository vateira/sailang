import { Parser, Token } from "./parser.ts";

const lineBreak = ["\n", "\r"];
const whiteSpaces = [" ", "\n", "\r", "\t"];
const keywords = ["let", "if", "then", "else"];

export const tokenize = function (source: string): Token[] {
  return (new Tokenizer(source)).tokenize();
};

class Tokenizer {
  private source: string;
  private index: number;
  private tokens: Token[];
  constructor(source: string) {
    this.source = source;
    this.index = 0;
    this.tokens = [];
  }

  private current() {
    return this.source.charAt(this.index);
  }

  private consume(len?: number): string {
    let c = "";
    for (let i = 0; i < (len ?? 1); i++) {
      c += this.source.charAt(this.index);
      this.index += 1;
    }
    return c;
  }

  private isNext(value: string): boolean {
    for (let i = 0; i < value.length; i++) {
      let cur = this.index + i;
      if (this.source.charAt(cur) != value.charAt(i)) {
        return false;
      }
    }
    return true;
  }

  private isNextKeyword(): boolean {
    for (const key of keywords) {
      if (this.isNext(key)) {
        return true;
      }
    }
    return false;
  }

  tokenize(): Token[] {
    this.skipWhiteSpaces();
    while (this.index < this.source.length) {
      if (this.isNextKeyword()) {
        this.readKeyword();
      } else if (/\d/.test(this.current())) {
        this.readNum();
      } else if (this.isNext("--")) {
        while (!lineBreak.includes(this.current())) this.consume();
        this.skipWhiteSpaces();
        continue;
      } else if (["\\", ";"].includes(this.current())) {
        const index = this.index;
        this.tokens.push(["SYMBOL", this.consume(), index]);
      } else if (
        this.isNext("->") || this.isNext(":=") || this.isNext("<=") ||
        this.isNext(">=") || this.isNext("!=")
      ) {
        const index = this.index;
        this.tokens.push(["OP", this.consume(2), index]);
      } else if (["=", "+", "-", "*", "/", "<", ">"].includes(this.current())) {
        const index = this.index;
        this.tokens.push(["OP", this.consume(), index]);
      } else if (["(", ")", "{", "}"].includes(this.current())) {
        const index = this.index;
        this.tokens.push(["PAREN", this.consume(), index]);
      } else {
        this.readIdent();
      }

      this.skipWhiteSpaces();
    }
    return this.tokens;
  }

  private skipWhiteSpaces() {
    while (whiteSpaces.includes(this.current())) this.consume();
  }

  private readNum() {
    const index = this.index;
    var i = "";
    while (/\d/.test(this.current())) {
      i += this.consume();
    }
    this.tokens.push(["NUM", i, index]);
  }

  private readIdent() {
    const index = this.index;
    var i = "";
    while (
      /[A-Za-z0-9_]/.test(this.current()) && this.index < this.source.length
    ) {
      i += this.consume();
    }
    this.tokens.push(["IDENT", i, index]);
  }

  private readKeyword() {
    const index = this.index;
    for (const key of keywords) {
      if (this.isNext(key)) {
        this.consume(key.length);
        this.tokens.push(["KEYWORD", key, index]);
      }
    }
  }
}
