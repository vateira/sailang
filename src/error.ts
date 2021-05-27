export type LangError = {
  message: string;
  position: number;
};

export const printError = function (error: LangError, source: string) {
  let l = 0;
  let c = 0;
  for (let i = 0; i < error.position; i++) {
    let s = source.charAt(i);
    if (s == "\n") {
      l += 1;
      c = 0;
    } else if (s == "\r") {}
    else {
      c += 1;
    }
  }
  const lines = source.split("\n");
  console.error("");
  console.error(`${error.message}: (line: ${l + 1}, column: ${c + 1})`);
  console.error("--------------------------------------------");

  function pLine(i: number): string {
    if (0 <= l && l < lines.length) {
      return `${`${i + 1}`.padStart(3, "0")}:${lines[i]}`;
    } else {
      return "";
    }
  }

  console.error(pLine(l - 1));
  console.error(pLine(l));
  console.error(`    ${" ".repeat(c)}^`);
  console.error(pLine(l + 1));

  console.error("");
};

export const isLangError = function (v: any): v is LangError {
  return v !== null && typeof v == "object" && v.hasOwnProperty("position") &&
    v.hasOwnProperty("message");
};
