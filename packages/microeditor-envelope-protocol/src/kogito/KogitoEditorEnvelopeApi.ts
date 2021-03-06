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

import { ChannelKeyboardEvent, EditorContent, Rect } from "./api";

export interface Association {
  origin: string;
  busId: string;
}

export interface EditorInitArgs {
  resourcesPathPrefix: string;
  fileExtension: string;
}

export interface KogitoEditorEnvelopeApi {
  receive_contentChanged(content: EditorContent): void;
  receive_editorUndo(): void;
  receive_editorRedo(): void;
  receive_initRequest(association: Association, editorInit: EditorInitArgs): Promise<void>;
  receive_contentRequest(): Promise<EditorContent>;
  receive_previewRequest(): Promise<string>;
  receive_guidedTourElementPositionRequest(selector: string): Promise<Rect>;
  receive_channelKeyboardEvent(channelKeyboardEvent: ChannelKeyboardEvent): void;
  receive_localeChange(locale: string): void;
}
