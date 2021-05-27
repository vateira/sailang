import { Node } from "./ast.ts";

export class Memory {
  mem: ({ [index: string]: Node })[];
  current: ({ [index: string]: Node });
  constructor() {
    this.current = {};
    this.mem = [];
  }

  beginScope() {
    this.mem.push({ ...this.current });
    this.current = {};
  }

  endScope() {
    this.current = this.mem.pop()!;
  }

  fetch(key: string): Node {
    if (this.current.hasOwnProperty(key)) {
      return this.current[key];
    }
    for (let i = this.mem.length - 1; i >= 0; i--) {
      if (this.mem[i].hasOwnProperty(key)) {
        return this.mem[i][key];
      }
    }
    throw `variable ${key} hasn't bounded to any values.`;
  }

  assign(key: string, value: Node) {
    this.current[key] = value;
  }
}
