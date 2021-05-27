import { run } from "./runner.ts";
import { isLangError, printError } from "./error.ts";

function main() {
  const file = Deno.args[0];
  const source = Deno.readTextFileSync(file);
  try {
    run(source);
  } catch (e) {
    if (isLangError(e)) {
      printError(e, source);
    } else {
      console.error(e);
    }
    Deno.exit(-1);
  }
  Deno.exit(0);
}

main();
