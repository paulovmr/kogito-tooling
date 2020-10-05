/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from "fs";

export interface JSResource {
  path: string;
  content: string;
}

export interface CSSResource {
  path: string;
  content: string;
}

export interface FontSource {
  mimeType: string;
  content: string;
  format: string;
}

export interface FontResource {
  family: string;
  sources: FontSource[];
  additionalStyle?: string;
}

export interface EditorResources {
  envelopeJSResource: JSResource;
  baseJSResources: JSResource[];
  referencedJSResources: JSResource[];
  baseCSSResources: CSSResource[];
  referencedCSSResources: CSSResource[];
  fontResources: FontResource[];
}

export interface FontSourceTypeAttributes {
  mimeType: string;
  format: string;
}

export const FONT_ATTRIBUTES = new Map<string, FontSourceTypeAttributes>([
  ["ttf", { mimeType: "font/ttf", format: "truetype" }],
  ["woff", { mimeType: "font/woff", format: "woff" }],
  ["woff2", { mimeType: "font/woff2", format: "woff2" }],
  ["eot", { mimeType: "application/vnd.ms-fontobject", format: "embedded-opentype" }],
  ["svg", { mimeType: "image/svg+xml", format: "svg" }]
]);

export abstract class BaseEditorResources {
  public abstract get(args: { resourcesPathPrefix: string }): EditorResources;
  public abstract getReferencedJSPaths(resourcesPathPrefix: string, gwtModuleName: string): string[];
  public abstract getReferencedCSSPaths(resourcesPathPrefix: string, gwtModuleName: string): string[];
  public abstract getFontResources(resourcesPathPrefix: string, gwtModuleName: string): FontResource[];
  public abstract getEditorResourcesPath(): string;
  public abstract getTemplatePath(): string;
  public abstract getHtmlOutputPath(): string;

  public createResource(path: string, escapeCharacters?: string[]) {
    let content = fs.readFileSync(path).toString();
    if (escapeCharacters) {
      escapeCharacters.forEach(character => {
        content = content.replace(new RegExp("[" + character.replace(/[\\]/g, "\\\\") + "]", "gi"), "\\" + character);
      })
    }

    return { path: path, content: content };
  }

  public createFontSource(path: string) {
    const fontAttributes = FONT_ATTRIBUTES.get(path.split(".").pop()!)!;
    return {
      mimeType: fontAttributes.mimeType,
      content: this.getBase64FromFile(path),
      format: fontAttributes.format
    };
  }

  public getBase64FromFile(path: string) {
    return Buffer.from(fs.readFileSync(path)).toString("base64");
  }
}