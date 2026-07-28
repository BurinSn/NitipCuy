import { checkDependencyBoundaries } from "./dependency-boundaries.mjs";

const result = checkDependencyBoundaries();

if (result.violations.length > 0) {
  process.stderr.write(
    `${result.violations
      .map(
        ({ code, column, file, line, message }) =>
          `${file}:${line}:${column} ${code} ${message}`,
      )
      .join("\n")}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Dependency boundaries passed: ${result.projectsChecked} projects, ${result.filesChecked} source files, ${result.moduleReferencesChecked} module references.\n`,
  );
}
