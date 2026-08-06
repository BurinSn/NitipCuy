import fs from "node:fs";
import module from "node:module";
import path from "node:path";

import ts from "typescript";

const sourceExtensions = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
]);
const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const runtimeDependencySections = new Set([
  "dependencies",
  "optionalDependencies",
  "peerDependencies",
]);
const testOnlyPackages = new Set(["vitest"]);
const nodeBuiltins = new Set(
  module.builtinModules.flatMap((name) => [name, `node:${name}`]),
);

export const defaultProjects = Object.freeze([
  Object.freeze({
    id: "domain",
    packageName: "@nitipcuy/domain",
    root: "packages/domain",
    sourceRoot: "packages/domain/src",
    allowedWorkspaceProjects: Object.freeze([]),
    allowRuntimeExternalPackages: false,
    allowNodeBuiltins: false,
  }),
  Object.freeze({
    id: "application",
    packageName: "@nitipcuy/application",
    root: "packages/application",
    sourceRoot: "packages/application/src",
    allowedWorkspaceProjects: Object.freeze(["domain"]),
    allowRuntimeExternalPackages: false,
    allowNodeBuiltins: false,
  }),
  Object.freeze({
    id: "adapters",
    packageName: "@nitipcuy/adapters",
    root: "packages/adapters",
    sourceRoot: "packages/adapters/src",
    allowedWorkspaceProjects: Object.freeze(["application", "domain"]),
    allowRuntimeExternalPackages: true,
    allowNodeBuiltins: true,
  }),
  Object.freeze({
    id: "web",
    packageName: "@nitipcuy/web",
    root: "apps/web",
    sourceRoot: "apps/web/src",
    allowedWorkspaceProjects: Object.freeze([
      "adapters",
      "application",
      "domain",
    ]),
    allowRuntimeExternalPackages: true,
    allowNodeBuiltins: true,
  }),
]);

export function checkDependencyBoundaries({
  projects = defaultProjects,
  workspaceRoot = process.cwd(),
} = {}) {
  const absoluteWorkspaceRoot = path.resolve(workspaceRoot);
  const normalizedProjects = projects.map((project) =>
    normalizeProject(project, absoluteWorkspaceRoot),
  );
  const projectByPackageName = new Map(
    normalizedProjects.map((project) => [project.packageName, project]),
  );
  const violations = [];
  let filesChecked = 0;
  let moduleReferencesChecked = 0;

  for (const project of normalizedProjects) {
    const manifest = readManifest(project, violations);
    project.manifest = manifest;
    validateManifest({
      manifest,
      project,
      projectByPackageName,
      violations,
    });
  }

  for (const project of normalizedProjects) {
    const files = collectSourceFiles(project, violations);
    filesChecked += files.length;

    for (const filePath of files) {
      const sourceText = fs.readFileSync(filePath, "utf8");
      const sourceFile = ts.createSourceFile(
        filePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
      );
      const references = collectModuleReferences(sourceFile);
      const clientModule = hasUseClientDirective(sourceFile);

      moduleReferencesChecked += references.length;

      for (const reference of references) {
        if (reference.specifier === null) {
          violations.push(
            sourceViolation({
              code: "NON_STATIC_MODULE_SPECIFIER",
              filePath,
              message: `${reference.kind} must use a static string so the architecture gate can verify its boundary.`,
              node: reference.node,
              sourceFile,
              workspaceRoot: absoluteWorkspaceRoot,
            }),
          );
          continue;
        }

        validateModuleReference({
          clientModule,
          filePath,
          project,
          projectByPackageName,
          projects: normalizedProjects,
          reference,
          sourceFile,
          violations,
          workspaceRoot: absoluteWorkspaceRoot,
        });
      }
    }
  }

  return Object.freeze({
    filesChecked,
    moduleReferencesChecked,
    projectsChecked: normalizedProjects.length,
    violations: Object.freeze(violations.sort(compareViolations)),
  });
}

function normalizeProject(project, workspaceRoot) {
  return {
    ...project,
    absoluteRoot: path.resolve(workspaceRoot, project.root),
    absoluteSourceRoot: path.resolve(workspaceRoot, project.sourceRoot),
    allowedWorkspaceProjects: new Set(project.allowedWorkspaceProjects),
    manifest: {},
    workspaceRoot,
  };
}

function readManifest(project, violations) {
  const manifestPath = path.join(project.absoluteRoot, "package.json");

  if (!fs.existsSync(manifestPath)) {
    violations.push({
      code: "MISSING_PROJECT_MANIFEST",
      column: 1,
      file: projectRelativePath(manifestPath, project),
      line: 1,
      message: `${project.packageName} must have a package.json manifest.`,
    });
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    violations.push({
      code: "INVALID_PROJECT_MANIFEST",
      column: 1,
      file: projectRelativePath(manifestPath, project),
      line: 1,
      message: `${project.packageName} package.json must contain valid JSON.`,
    });
    return {};
  }
}

function validateManifest({
  manifest,
  project,
  projectByPackageName,
  violations,
}) {
  for (const section of dependencySections) {
    const dependencies = manifest[section];

    if (!dependencies || typeof dependencies !== "object") {
      continue;
    }

    for (const [packageName, version] of Object.entries(dependencies)) {
      const targetProject = projectByPackageName.get(packageName);

      if (packageName.startsWith("@nitipcuy/") && !targetProject) {
        violations.push(
          manifestViolation(
            project,
            "UNKNOWN_WORKSPACE_DEPENDENCY",
            `${project.packageName} ${section} declares unknown NitipCuy package ${packageName}.`,
          ),
        );
        continue;
      }

      if (targetProject) {
        if (!project.allowedWorkspaceProjects.has(targetProject.id)) {
          violations.push(
            manifestViolation(
              project,
              "DISALLOWED_WORKSPACE_DEPENDENCY",
              `${project.packageName} ${section} cannot depend on ${packageName}.`,
            ),
          );
          continue;
        }

        if (typeof version !== "string" || !version.startsWith("workspace:")) {
          violations.push(
            manifestViolation(
              project,
              "WORKSPACE_PROTOCOL_REQUIRED",
              `${project.packageName} must reference ${packageName} through the workspace protocol.`,
            ),
          );
        }

        continue;
      }

      if (
        runtimeDependencySections.has(section) &&
        !project.allowRuntimeExternalPackages
      ) {
        violations.push(
          manifestViolation(
            project,
            "EXTERNAL_RUNTIME_DEPENDENCY_FORBIDDEN",
            `${project.packageName} ${section} cannot declare external runtime package ${packageName}.`,
          ),
        );
      }
    }
  }
}

function collectSourceFiles(project, violations) {
  if (!fs.existsSync(project.absoluteSourceRoot)) {
    violations.push({
      code: "MISSING_SOURCE_ROOT",
      column: 1,
      file: projectRelativePath(project.absoluteSourceRoot, project),
      line: 1,
      message: `${project.packageName} must have its configured source root.`,
    });
    return [];
  }

  const sourceRootStats = fs.lstatSync(project.absoluteSourceRoot);

  if (sourceRootStats.isSymbolicLink()) {
    violations.push({
      code: "SOURCE_SYMLINK_FORBIDDEN",
      column: 1,
      file: path.relative(project.workspaceRoot, project.absoluteSourceRoot),
      line: 1,
      message:
        "Governed source roots cannot be symlinks because they can escape lexical dependency boundaries.",
    });
    return [];
  }

  if (!sourceRootStats.isDirectory()) {
    violations.push({
      code: "INVALID_SOURCE_ROOT",
      column: 1,
      file: path.relative(project.workspaceRoot, project.absoluteSourceRoot),
      line: 1,
      message: `${project.packageName} source root must be a directory.`,
    });
    return [];
  }

  const files = [];
  const pendingDirectories = [project.absoluteSourceRoot];

  while (pendingDirectories.length > 0) {
    const directory = pendingDirectories.pop();

    if (!directory) {
      continue;
    }

    const entries = fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isSymbolicLink()) {
        violations.push({
          code: "SOURCE_SYMLINK_FORBIDDEN",
          column: 1,
          file: path.relative(project.workspaceRoot, entryPath),
          line: 1,
          message:
            "Governed source roots cannot contain symlinks because they can escape lexical dependency boundaries.",
        });
        continue;
      }

      if (entry.isDirectory()) {
        pendingDirectories.push(entryPath);
        continue;
      }

      if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
        files.push(entryPath);
      }
    }
  }

  return files.sort();
}

function collectModuleReferences(sourceFile) {
  const references = [];

  for (const reference of sourceFile.referencedFiles) {
    references.push({
      kind: "triple-slash path reference",
      node: sourceFile,
      specifier: reference.fileName,
      typeOnly: true,
    });
  }

  for (const reference of sourceFile.typeReferenceDirectives) {
    references.push({
      kind: "triple-slash type reference",
      node: sourceFile,
      specifier: reference.fileName,
      typeOnly: true,
    });
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (
        node.moduleSpecifier &&
        ts.isStringLiteralLike(node.moduleSpecifier)
      ) {
        references.push({
          kind: ts.isImportDeclaration(node) ? "import" : "export",
          node: node.moduleSpecifier,
          specifier: node.moduleSpecifier.text,
          typeOnly: moduleDeclarationIsTypeOnly(node),
        });
      }
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      references.push({
        kind: "import equals",
        node: node.moduleReference,
        specifier: staticSpecifier(node.moduleReference.expression),
        typeOnly: node.isTypeOnly,
      });
    } else if (ts.isImportTypeNode(node)) {
      const argument = node.argument;
      references.push({
        kind: "import type expression",
        node: argument,
        specifier:
          ts.isLiteralTypeNode(argument) &&
          ts.isStringLiteralLike(argument.literal)
            ? argument.literal.text
            : null,
        typeOnly: true,
      });
    } else if (ts.isCallExpression(node)) {
      const kind = callImportKind(node.expression);

      if (kind) {
        references.push({
          kind,
          node,
          specifier: staticSpecifier(node.arguments[0]),
          typeOnly: false,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return references;
}

function callImportKind(expression) {
  if (expression.kind === ts.SyntaxKind.ImportKeyword) {
    return "dynamic import";
  }

  if (ts.isIdentifier(expression) && expression.text === "require") {
    return "require";
  }

  if (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    ((expression.expression.text === "require" &&
      expression.name.text === "resolve") ||
      (expression.expression.text === "module" &&
        expression.name.text === "require"))
  ) {
    return expression.expression.text === "module"
      ? "module.require"
      : "require.resolve";
  }

  return null;
}

function staticSpecifier(node) {
  return node && ts.isStringLiteralLike(node) ? node.text : null;
}

function validateModuleReference({
  clientModule,
  filePath,
  project,
  projectByPackageName,
  projects,
  reference,
  sourceFile,
  violations,
  workspaceRoot,
}) {
  const specifier = reference.specifier;

  if (specifier.startsWith(".")) {
    validateRelativeReference({
      filePath,
      project,
      projects,
      reference,
      sourceFile,
      violations,
      workspaceRoot,
    });
    return;
  }

  if (path.isAbsolute(specifier)) {
    violations.push(
      sourceViolation({
        code: "ABSOLUTE_IMPORT_FORBIDDEN",
        filePath,
        message: `Absolute import ${specifier} is forbidden in governed source.`,
        node: reference.node,
        sourceFile,
        workspaceRoot,
      }),
    );
    return;
  }

  if (specifier.startsWith("@/")) {
    validateWebAlias({
      clientModule,
      filePath,
      project,
      reference,
      sourceFile,
      violations,
      workspaceRoot,
    });
    return;
  }

  const workspaceMatch = /^(@nitipcuy\/[^/]+)(?:\/(.+))?$/.exec(specifier);

  if (workspaceMatch) {
    const packageName = workspaceMatch[1];
    const subpath = workspaceMatch[2];
    const targetProject = projectByPackageName.get(packageName);

    if (!targetProject) {
      violations.push(
        sourceViolation({
          code: "UNKNOWN_WORKSPACE_IMPORT",
          filePath,
          message: `Unknown NitipCuy workspace package ${packageName}.`,
          node: reference.node,
          sourceFile,
          workspaceRoot,
        }),
      );
      return;
    }

    if (subpath) {
      violations.push(
        sourceViolation({
          code: "WORKSPACE_DEEP_IMPORT_FORBIDDEN",
          filePath,
          message: `Import ${specifier} bypasses the public export of ${packageName}.`,
          node: reference.node,
          sourceFile,
          workspaceRoot,
        }),
      );
      return;
    }

    if (!project.allowedWorkspaceProjects.has(targetProject.id)) {
      violations.push(
        sourceViolation({
          code: "DISALLOWED_WORKSPACE_IMPORT",
          filePath,
          message: `${project.packageName} cannot import ${packageName}.`,
          node: reference.node,
          sourceFile,
          workspaceRoot,
        }),
      );
      return;
    }

    if (!declaresDependency(project.manifest, packageName)) {
      violations.push(
        sourceViolation({
          code: "UNDECLARED_WORKSPACE_IMPORT",
          filePath,
          message: `${project.packageName} imports ${packageName} without declaring it in package.json.`,
          node: reference.node,
          sourceFile,
          workspaceRoot,
        }),
      );
      return;
    }

    if (
      !reference.typeOnly &&
      !isTestFile(filePath) &&
      !declaresRuntimeDependency(project.manifest, packageName)
    ) {
      violations.push(
        sourceViolation({
          code: "RUNTIME_DEPENDENCY_PLACEMENT_REQUIRED",
          filePath,
          message: `${project.packageName} runtime import ${packageName} must be declared in dependencies, optionalDependencies, or peerDependencies.`,
          node: reference.node,
          sourceFile,
          workspaceRoot,
        }),
      );
      return;
    }

    if (
      project.id === "web" &&
      targetProject.id === "adapters" &&
      !isWithin(filePath, path.join(project.absoluteSourceRoot, "server"))
    ) {
      violations.push(
        sourceViolation({
          code: "WEB_DELIVERY_ADAPTER_IMPORT_FORBIDDEN",
          filePath,
          message:
            "Web delivery cannot import concrete adapters outside the server composition boundary.",
          node: reference.node,
          sourceFile,
          workspaceRoot,
        }),
      );
      return;
    }

    if (
      clientModule &&
      !reference.typeOnly &&
      (targetProject.id === "adapters" || targetProject.id === "application")
    ) {
      violations.push(
        sourceViolation({
          code: "CLIENT_CORE_RUNTIME_IMPORT_FORBIDDEN",
          filePath,
          message: `Client modules cannot import ${packageName}; call a protected server boundary instead.`,
          node: reference.node,
          sourceFile,
          workspaceRoot,
        }),
      );
    }

    return;
  }

  validateExternalReference({
    clientModule,
    filePath,
    project,
    reference,
    sourceFile,
    violations,
    workspaceRoot,
  });
}

function validateRelativeReference({
  filePath,
  project,
  projects,
  reference,
  sourceFile,
  violations,
  workspaceRoot,
}) {
  const targetPath = path.resolve(path.dirname(filePath), reference.specifier);
  const targetProject = projects.find((candidate) =>
    isWithin(targetPath, candidate.absoluteRoot),
  );

  if (targetProject && targetProject.id !== project.id) {
    violations.push(
      sourceViolation({
        code: "CROSS_PROJECT_RELATIVE_IMPORT",
        filePath,
        message: `Relative import ${reference.specifier} crosses from ${project.packageName} into ${targetProject.packageName}; use and validate the public workspace export.`,
        node: reference.node,
        sourceFile,
        workspaceRoot,
      }),
    );
    return;
  }

  if (!isWithin(targetPath, project.absoluteSourceRoot)) {
    violations.push(
      sourceViolation({
        code: "SOURCE_ROOT_ESCAPE",
        filePath,
        message: `Relative import ${reference.specifier} escapes ${project.sourceRoot}.`,
        node: reference.node,
        sourceFile,
        workspaceRoot,
      }),
    );
  }
}

function validateWebAlias({
  clientModule,
  filePath,
  project,
  reference,
  sourceFile,
  violations,
  workspaceRoot,
}) {
  if (project.id !== "web") {
    violations.push(
      sourceViolation({
        code: "WEB_ALIAS_OUTSIDE_WEB",
        filePath,
        message: `Alias ${reference.specifier} is available only inside @nitipcuy/web.`,
        node: reference.node,
        sourceFile,
        workspaceRoot,
      }),
    );
    return;
  }

  const targetPath = path.resolve(
    project.absoluteSourceRoot,
    reference.specifier.slice(2),
  );

  if (!isWithin(targetPath, project.absoluteSourceRoot)) {
    violations.push(
      sourceViolation({
        code: "WEB_ALIAS_ESCAPE",
        filePath,
        message: `Alias ${reference.specifier} escapes apps/web/src.`,
        node: reference.node,
        sourceFile,
        workspaceRoot,
      }),
    );
    return;
  }

  if (
    clientModule &&
    isWithin(targetPath, path.join(project.absoluteSourceRoot, "server"))
  ) {
    violations.push(
      sourceViolation({
        code: "CLIENT_SERVER_IMPORT_FORBIDDEN",
        filePath,
        message: `Client modules cannot import server source through ${reference.specifier}.`,
        node: reference.node,
        sourceFile,
        workspaceRoot,
      }),
    );
  }
}

function validateExternalReference({
  clientModule,
  filePath,
  project,
  reference,
  sourceFile,
  violations,
  workspaceRoot,
}) {
  const specifier = reference.specifier;
  const testFile = isTestFile(filePath);

  if (nodeBuiltins.has(specifier)) {
    if ((!project.allowNodeBuiltins && !testFile) || clientModule) {
      violations.push(
        sourceViolation({
          code: "NODE_BUILTIN_IMPORT_FORBIDDEN",
          filePath,
          message: `${project.packageName} cannot import Node.js builtin ${specifier} from this source file.`,
          node: reference.node,
          sourceFile,
          workspaceRoot,
        }),
      );
    }
    return;
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(specifier)) {
    violations.push(
      sourceViolation({
        code: "MODULE_SCHEME_FORBIDDEN",
        filePath,
        message: `Module scheme import ${specifier} is forbidden.`,
        node: reference.node,
        sourceFile,
        workspaceRoot,
      }),
    );
    return;
  }

  const packageName = externalPackageName(specifier);

  if (testFile && testOnlyPackages.has(packageName)) {
    return;
  }

  if (!project.allowRuntimeExternalPackages) {
    violations.push(
      sourceViolation({
        code: "EXTERNAL_IMPORT_FORBIDDEN",
        filePath,
        message: `${project.packageName} cannot import external package ${packageName}.`,
        node: reference.node,
        sourceFile,
        workspaceRoot,
      }),
    );
    return;
  }

  if (!declaresDependency(project.manifest, packageName)) {
    violations.push(
      sourceViolation({
        code: "UNDECLARED_EXTERNAL_IMPORT",
        filePath,
        message: `${project.packageName} imports ${packageName} without declaring it in package.json.`,
        node: reference.node,
        sourceFile,
        workspaceRoot,
      }),
    );
    return;
  }

  if (
    !reference.typeOnly &&
    !testFile &&
    !declaresRuntimeDependency(project.manifest, packageName)
  ) {
    violations.push(
      sourceViolation({
        code: "RUNTIME_DEPENDENCY_PLACEMENT_REQUIRED",
        filePath,
        message: `${project.packageName} runtime import ${packageName} must be declared in dependencies, optionalDependencies, or peerDependencies.`,
        node: reference.node,
        sourceFile,
        workspaceRoot,
      }),
    );
  }

  if (clientModule && packageName === "server-only") {
    violations.push(
      sourceViolation({
        code: "CLIENT_SERVER_ONLY_IMPORT_FORBIDDEN",
        filePath,
        message: "Client modules cannot import the server-only marker.",
        node: reference.node,
        sourceFile,
        workspaceRoot,
      }),
    );
  }
}

function hasUseClientDirective(sourceFile) {
  return sourceFile.statements.some(
    (statement) =>
      ts.isExpressionStatement(statement) &&
      ts.isStringLiteral(statement.expression) &&
      statement.expression.text === "use client",
  );
}

function moduleDeclarationIsTypeOnly(node) {
  if (node.isTypeOnly || node.importClause?.isTypeOnly) {
    return true;
  }

  if (
    ts.isExportDeclaration(node) &&
    node.exportClause &&
    ts.isNamedExports(node.exportClause)
  ) {
    return (
      node.exportClause.elements.length > 0 &&
      node.exportClause.elements.every((element) => element.isTypeOnly)
    );
  }

  const bindings = node.importClause?.namedBindings;

  return (
    bindings !== undefined &&
    ts.isNamedImports(bindings) &&
    node.importClause?.name === undefined &&
    bindings.elements.length > 0 &&
    bindings.elements.every((element) => element.isTypeOnly)
  );
}

function isTestFile(filePath) {
  return (
    /(?:^|[/\\])__tests__(?:[/\\])/.test(filePath) ||
    /\.(?:spec|test)\.[cm]?[jt]sx?$/.test(filePath)
  );
}

function externalPackageName(specifier) {
  if (specifier.startsWith("@")) {
    return specifier.split("/").slice(0, 2).join("/");
  }

  return specifier.split("/", 1)[0];
}

function declaresDependency(manifest, packageName) {
  return dependencySections.some((section) =>
    Object.prototype.hasOwnProperty.call(manifest[section] ?? {}, packageName),
  );
}

function declaresRuntimeDependency(manifest, packageName) {
  return [...runtimeDependencySections].some((section) =>
    Object.prototype.hasOwnProperty.call(manifest[section] ?? {}, packageName),
  );
}

function isWithin(candidatePath, parentPath) {
  const relative = path.relative(parentPath, candidatePath);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function sourceViolation({
  code,
  filePath,
  message,
  node,
  sourceFile,
  workspaceRoot,
}) {
  const location = sourceFile.getLineAndCharacterOfPosition(node.getStart());

  return {
    code,
    column: location.character + 1,
    file: path.relative(workspaceRoot, filePath),
    line: location.line + 1,
    message,
  };
}

function manifestViolation(project, code, message) {
  return {
    code,
    column: 1,
    file: path.join(project.root, "package.json"),
    line: 1,
    message,
  };
}

function projectRelativePath(filePath, project) {
  return path.relative(project.workspaceRoot, filePath);
}

function compareViolations(left, right) {
  return (
    left.file.localeCompare(right.file) ||
    left.line - right.line ||
    left.column - right.column ||
    left.code.localeCompare(right.code)
  );
}
