export type NodeKind =
  | "STATEMENTS"
  | "OP"
  | "VALUE"
  | "REF"
  | "ASSIGN"
  | "LAMBDA"
  | "CALL"
  | "COND";

export type NodeValue = string | number | NodeValue[] | Func | null | boolean;

export type Node = {
  kind: NodeKind;
  value: NodeValue;
  position: number;
  nodes?: Node[];
};

export type Func = {
  args: string[];
  expr: Node;
};

export const cmd = function (
  k: NodeKind,
  p: number,
  v: NodeValue,
  ns?: Node[],
): Node {
  return {
    kind: k,
    position: p,
    value: v,
    nodes: ns,
  };
};

export const isFunc = function (v: NodeValue): v is Func {
  return v !== null && typeof v == "object" && v.hasOwnProperty("args") &&
    v.hasOwnProperty("expr");
};
