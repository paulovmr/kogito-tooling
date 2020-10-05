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

import { ContentType } from "@kogito-tooling/channel-common-api/dist";
import { EditorApi, KogitoEditorChannelApi, KogitoEditorEnvelopeApi } from "@kogito-tooling/editor/dist/api";
import { StateControl } from "@kogito-tooling/editor/dist/channel";
import { MessageBusClientApi } from "@kogito-tooling/envelope-bus/dist/api";
import { EnvelopeServer } from "@kogito-tooling/envelope-bus/dist/channel";

export interface Editor {
  open: (args: {
    container: Element;
    initialContent: Promise<string>;
    readOnly: boolean;
    origin?: string;
    resources?: Map<string, { contentType: ContentType; content: Promise<string> }>;
  }) => EditorApi & {
    stateControl: StateControl;
    envelopeApi: MessageBusClientApi<KogitoEditorEnvelopeApi>;
    close: () => void;
  };
}

export const createEditor = (
  envelopeServer: EnvelopeServer<KogitoEditorChannelApi, KogitoEditorEnvelopeApi>,
  stateControl: StateControl,
  listener: (message: MessageEvent) => void,
  iframe: HTMLIFrameElement
) => {
  return {
    getElementPosition: (selector: string) =>
      envelopeServer.envelopeApi.requests.receive_guidedTourElementPositionRequest(selector),
    undo: () => Promise.resolve(envelopeServer.envelopeApi.notifications.receive_editorUndo()),
    redo: () => Promise.resolve(envelopeServer.envelopeApi.notifications.receive_editorRedo()),
    getContent: () => envelopeServer.envelopeApi.requests.receive_contentRequest().then(c => c.content),
    getPreview: () => envelopeServer.envelopeApi.requests.receive_previewRequest(),
    setContent: async (content: string) =>
      envelopeServer.envelopeApi.notifications.receive_contentChanged({ content: content }),
    stateControl: stateControl,
    envelopeApi: envelopeServer.envelopeApi,
    close: () => {
      window.removeEventListener("message", listener);
      iframe.remove();
    }
  };
};