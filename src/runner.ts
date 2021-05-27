import { assertEquals } from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { cmd, Node, NodeValue } from "./ast.ts";
import { tokenize } from "./tokenizer.ts";
import { Parser } from "./parser.ts";
import { Memory } from "./memory.ts";

Deno.test("caluclation", () => {
  assertEquals(run("1 +   1;"), [2]);
  assertEquals(run("4*4 - 2;"), [14]);
  assertEquals(run("3 + 4 * 2;"), [11]);
  assertEquals(run("(3 + 4) * 2;"), [14]);
});

Deno.test("let binads a variable to a value", () => {
  const code = `
    let a := 5 + 7;
    print 2 * (3 + 5) / 4 + a;
`;
  assertEquals(run(code), [12, "16"]);
});

Deno.test("define a function", () => {
  console.log("");
  const code = `
    let x := 10;
    let f := \\x y -> x + y;
    f 3 4;
    print x;
  `;
  assertEquals(run(code), [10, "fn", 7, "10"]);
});

var memory = new Memory();

export const run = function (source: string): NodeValue {
  const tokens = tokenize(source);
  const parser = new Parser(tokens);
  const ast = parser.parse();

  return Runner.run(ast);
};

class Runner {
  static run(node: Node): NodeValue {
    switch (node.kind) {
      case "STATEMENTS":
        switch (node.value) {
          case "loop":
            const times = this.run(node.nodes![0]) as number;
            return ([...Array(times).keys()].map((_) =>
              this.run(node.nodes![1])
            ));

          default:
            return node.nodes!.map((n: Node) => this.run(n));
        }

      case "LAMBDA":
        return { args: node.value as string[], expr: node.nodes![0] };

      case "ASSIGN":
        const value = node.nodes![0];
        memory.assign(node.value as string, value);

        if (value.kind == "LAMBDA") {
          return "fn";
        }
        return this.run(value);
      case "OP":
        const lhs = this.run(node.nodes![0]) as number;
        const rhs = this.run(node.nodes![1]) as number;
        switch (node.value) {
          case "+":
            return lhs + rhs;
          case "-":
            return lhs - rhs;
          case "*":
            return lhs * rhs;
          case "/":
            return lhs / rhs;
          case ">":
            return lhs > rhs;
          case "<":
            return lhs < rhs;
          case "<=":
            return lhs <= rhs;
          case ">=":
            return lhs >= rhs;
          case "=":
            return lhs == rhs;
          case "!=":
            return lhs != rhs;
          default:
            throw {
              message: `Unexpected operator ${node.value}`,
              position: node.position,
            };
        }

      case "VALUE":
        return node.value;

      case "REF":
        const key = node.value as string;
        return this.run(memory.fetch(key));

      case "CALL":
        switch (node.value) {
          case "print":
            const exp = this.run(node.nodes![0]);
            console.log(exp);
            return `${exp}`;

          default:
            memory.beginScope();
            const key = node.value as string;
            const func = memory.fetch(key);
            const formals = func.value as string[];
            const actuals = node.nodes ?? [];
            if (formals.length != actuals.length) {
              throw {
                message:
                  `Arity of "${key}" is ${formals.length}, but ${actuals.length} given`,
                position: node.position,
              };
            }
            for (let i = 0; i < formals.length; i++) {
              const formal = formals[i];
              const actual = this.run(actuals[i]);
              memory.assign(formal, cmd("VALUE", actuals[1].position, actual));
            }
            const value = this.run(func.nodes![0]);
            memory.endScope();
            return value;
        }

      case "COND":
        const cond = this.run(node.nodes![0]);
        if (cond) {
          return this.run(node.nodes![1]);
        } else {
          return this.run(node.nodes![2]);
        }

      default:
        throw {
          message: `Unexpected Node ${node.value}`,
          position: node.position,
        };
    }
  }
}
