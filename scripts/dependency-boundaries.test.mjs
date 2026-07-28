import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { checkDependencyBoundaries } from "./dependency-boundaries.mjs";

const projectDefinitions = [
  {
    dependencies: {},
    id: "domain",
    packageName: "@nitipcuy/domain",
    root: "packages/domain",
  },
  {
    dependencies: { "@nitipcuy/domain": "workspace:*" },
    id: "application",
    packageName: "@nitipcuy/application",
    root: "packages/application",
  },
  {
    dependencies: {
      "@nitipcuy/application": "workspace:*",
      "@nitipcuy/domain": "workspace:*",
    },
    id: "adapters",
    packageName: "@nitipcuy/adapters",
    root: "packages/adapters",
  },
  {
    dependencies: {
      "@nitipcuy/adapters": "workspace:*",
      "@nitipcuy/application": "workspace:*",
      "@nitipcuy/domain": "workspace:*",
      next: "16.2.11",
      react: "19.2.8",
      "server-only": "0.0.1",
    },
    id: "web",
    packageName: "@nitipcuy/web",
    root: "apps/web",
  },
];

test("allows the accepted inward dependency direction and test tooling", (t) => {
  const workspace = createWorkspace(t);

  workspace.write(
    "packages/application/src/use-case.ts",
    'import type { PublishedTrip } from "@nitipcuy/domain";\nexport type Result = PublishedTrip;\n',
  );
  workspace.write(
    "packages/adapters/src/adapter.ts",
    'export { ListPublishedTrips } from "@nitipcuy/application";\n',
  );
  workspace.write(
    "apps/web/src/server/composition.ts",
    'import "server-only";\nimport { InMemoryTripDiscoveryRepository } from "@nitipcuy/adapters";\nexport { InMemoryTripDiscoveryRepository };\n',
  );
  workspace.write(
    "apps/web/src/app/contracts.tsx",
    '"use client";\nimport type { ListPublishedTrips } from "@nitipcuy/application";\nexport type Query = ListPublishedTrips;\n',
  );
  workspace.write(
    "packages/domain/src/domain.test.ts",
    'import { describe } from "vitest";\ndescribe("domain", () => {});\n',
  );

  assert.deepEqual(check(workspace).violations, []);
});

test("rejects a type-only outward workspace import", (t) => {
  const workspace = createWorkspace(t);
  workspace.write(
    "packages/application/src/bad.ts",
    'import type { Adapter } from "@nitipcuy/adapters";\nexport type Bad = Adapter;\n',
  );

  assertViolation(workspace, "DISALLOWED_WORKSPACE_IMPORT");
});

test("rejects an import-type expression as an outward-import bypass", (t) => {
  const workspace = createWorkspace(t);
  workspace.write(
    "packages/application/src/bad.ts",
    'export type Bad = import("@nitipcuy/adapters").Adapter;\n',
  );

  assertViolation(workspace, "DISALLOWED_WORKSPACE_IMPORT");
});

test("rejects a dynamic outward workspace import", (t) => {
  const workspace = createWorkspace(t);
  workspace.write(
    "packages/domain/src/bad.ts",
    'export const load = () => import("@nitipcuy/application");\n',
  );

  assertViolation(workspace, "DISALLOWED_WORKSPACE_IMPORT");
});

test("rejects require as an outward-import bypass", (t) => {
  const workspace = createWorkspace(t);
  workspace.write(
    "packages/application/src/bad.ts",
    'export const load = () => module.require("@nitipcuy/adapters");\n',
  );

  assertViolation(workspace, "DISALLOWED_WORKSPACE_IMPORT");
});

test("rejects triple-slash type references as an outward-import bypass", (t) => {
  const workspace = createWorkspace(t);
  workspace.write(
    "packages/application/src/bad.ts",
    '/// <reference types="@nitipcuy/adapters" />\nexport type Bad = true;\n',
  );

  assertViolation(workspace, "DISALLOWED_WORKSPACE_IMPORT");
});

test("rejects cross-project relative imports even when the direction is allowed", (t) => {
  const workspace = createWorkspace(t);
  workspace.write(
    "packages/application/src/bad.ts",
    'export { tripId } from "../../domain/src/index.ts";\n',
  );

  assertViolation(workspace, "CROSS_PROJECT_RELATIVE_IMPORT");
});

test("rejects non-static dynamic imports that cannot be inspected", (t) => {
  const workspace = createWorkspace(t);
  workspace.write(
    "apps/web/src/server/bad.ts",
    "export const load = (name) => import(name);\n",
  );

  assertViolation(workspace, "NON_STATIC_MODULE_SPECIFIER");
});

test("rejects workspace deep imports that bypass public exports", (t) => {
  const workspace = createWorkspace(t);
  workspace.write(
    "packages/application/src/bad.ts",
    'export { tripId } from "@nitipcuy/domain/src/trip";\n',
  );

  assertViolation(workspace, "WORKSPACE_DEEP_IMPORT_FORBIDDEN");
});

test("rejects forbidden workspace dependencies declared in a manifest", (t) => {
  const workspace = createWorkspace(t);
  workspace.setDependencies("application", {
    "@nitipcuy/adapters": "workspace:*",
    "@nitipcuy/domain": "workspace:*",
  });

  assertViolation(workspace, "DISALLOWED_WORKSPACE_DEPENDENCY");
});

test("rejects unknown NitipCuy packages declared in a manifest", (t) => {
  const workspace = createWorkspace(t);
  workspace.setDependencies("web", {
    ...projectDefinitions.find((project) => project.id === "web").dependencies,
    "@nitipcuy/unknown": "workspace:*",
  });

  assertViolation(workspace, "UNKNOWN_WORKSPACE_DEPENDENCY");
});

test("rejects unknown NitipCuy packages imported from source", (t) => {
  const workspace = createWorkspace(t);
  workspace.write(
    "apps/web/src/server/bad.ts",
    'export { unknown } from "@nitipcuy/unknown";\n',
  );

  assertViolation(workspace, "UNKNOWN_WORKSPACE_IMPORT");
});

test("rejects external runtime dependencies in the domain manifest", (t) => {
  const workspace = createWorkspace(t);
  workspace.setDependencies("domain", { next: "16.2.11" });

  assertViolation(workspace, "EXTERNAL_RUNTIME_DEPENDENCY_FORBIDDEN");
});

test("rejects allowed workspace imports missing from the manifest", (t) => {
  const workspace = createWorkspace(t);
  workspace.setDependencies("application", {});
  workspace.write(
    "packages/application/src/bad.ts",
    'export { tripId } from "@nitipcuy/domain";\n',
  );

  assertViolation(workspace, "UNDECLARED_WORKSPACE_IMPORT");
});

test("rejects production runtime imports declared only as development dependencies", (t) => {
  const workspace = createWorkspace(t);
  workspace.setDependencies("application", {});
  workspace.setDevelopmentDependencies("application", {
    "@nitipcuy/domain": "workspace:*",
  });
  workspace.write(
    "packages/application/src/bad.ts",
    'export { tripId } from "@nitipcuy/domain";\n',
  );

  assertViolation(workspace, "RUNTIME_DEPENDENCY_PLACEMENT_REQUIRED");
});

test("rejects concrete adapters imported directly by web delivery", (t) => {
  const workspace = createWorkspace(t);
  workspace.write(
    "apps/web/src/app/bad.tsx",
    'import { InMemoryTripDiscoveryRepository } from "@nitipcuy/adapters";\nexport const bad = InMemoryTripDiscoveryRepository;\n',
  );

  assertViolation(workspace, "WEB_DELIVERY_ADAPTER_IMPORT_FORBIDDEN");
});

test("rejects client modules importing server aliases", (t) => {
  const workspace = createWorkspace(t);
  workspace.write(
    "apps/web/src/app/bad.tsx",
    '"use client";\nimport { application } from "@/server/composition";\nexport const bad = application;\n',
  );

  assertViolation(workspace, "CLIENT_SERVER_IMPORT_FORBIDDEN");
});

test("rejects client runtime imports from the application core", (t) => {
  const workspace = createWorkspace(t);
  workspace.write(
    "apps/web/src/app/bad.tsx",
    '"use client";\nimport { ListPublishedTrips } from "@nitipcuy/application";\nexport const bad = ListPublishedTrips;\n',
  );

  assertViolation(workspace, "CLIENT_CORE_RUNTIME_IMPORT_FORBIDDEN");
});

test("rejects source-root symlinks instead of following them", (t) => {
  const workspace = createWorkspace(t);
  const outsideFile = path.join(workspace.root, "outside.ts");
  const symlink = path.join(
    workspace.root,
    "packages/domain/src/symlinked-source.ts",
  );

  fs.writeFileSync(outsideFile, "export const outside = true;\n");
  fs.symlinkSync(outsideFile, symlink);

  assertViolation(workspace, "SOURCE_SYMLINK_FORBIDDEN");
});

test("rejects a governed source root that is itself a symlink", (t) => {
  const workspace = createWorkspace(t);
  const sourceRoot = path.join(workspace.root, "packages/domain/src");
  const outsideDirectory = path.join(workspace.root, "outside-domain");

  fs.mkdirSync(outsideDirectory);
  fs.writeFileSync(
    path.join(outsideDirectory, "index.ts"),
    "export const outside = true;\n",
  );
  fs.rmSync(sourceRoot, { force: true, recursive: true });
  fs.symlinkSync(outsideDirectory, sourceRoot, "dir");

  assertViolation(workspace, "SOURCE_SYMLINK_FORBIDDEN");
});

function createWorkspace(t) {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "nitipcuy-boundaries-test-"),
  );
  const manifests = new Map();

  t.after(() => {
    fs.rmSync(root, { force: true, recursive: true });
  });

  for (const project of projectDefinitions) {
    const sourceRoot = path.join(root, project.root, "src");
    const manifest = {
      dependencies: { ...project.dependencies },
      name: project.packageName,
      private: true,
      type: "module",
      version: "0.0.0-test",
    };

    fs.mkdirSync(sourceRoot, { recursive: true });
    manifests.set(project.id, {
      manifest,
      path: path.join(root, project.root, "package.json"),
    });
    fs.writeFileSync(
      path.join(root, project.root, "package.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    fs.writeFileSync(
      path.join(sourceRoot, "index.ts"),
      `export const ${project.id} = true;\n`,
    );
  }

  return {
    root,
    setDependencies(projectId, dependencies) {
      const entry = manifests.get(projectId);
      assert.ok(entry);
      entry.manifest.dependencies = dependencies;
      fs.writeFileSync(
        entry.path,
        `${JSON.stringify(entry.manifest, null, 2)}\n`,
      );
    },
    setDevelopmentDependencies(projectId, devDependencies) {
      const entry = manifests.get(projectId);
      assert.ok(entry);
      entry.manifest.devDependencies = devDependencies;
      fs.writeFileSync(
        entry.path,
        `${JSON.stringify(entry.manifest, null, 2)}\n`,
      );
    },
    write(relativePath, content) {
      const filePath = path.join(root, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
    },
  };
}

function check(workspace) {
  return checkDependencyBoundaries({ workspaceRoot: workspace.root });
}

function assertViolation(workspace, code) {
  const result = check(workspace);
  assert.ok(
    result.violations.some((violation) => violation.code === code),
    `Expected ${code}, received:\n${JSON.stringify(result.violations, null, 2)}`,
  );
}
