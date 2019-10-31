/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
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

import * as React from "react";
import {
  Button, 
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
  PageSection,
} from '@patternfly/react-core';
import "@patternfly/patternfly/patternfly-no-reset.css";

interface Props {
  onFullScreen: () => void;
  onSave: () => void;
  onClose: () => void;
};

export class SingleEditorToolbar extends React.Component<Props> {

  constructor(props: Props) {
    super(props);
  }
  
  private goFullScreen(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    this.props.onFullScreen();
  };

  private save(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    this.props.onSave();
  };

  private close(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    this.props.onClose();
  };

  public render() {
    return (
      <PageSection type="nav" variant="dark">
        <Toolbar className="pf-u-mb-sm">
          <ToolbarGroup>
            <ToolbarItem className="pf-u-mr-sm">
              <Button variant="primary" onClick={(e) => this.save(e)}>Save</Button>
            </ToolbarItem>
            <ToolbarItem>
            <Button variant="secondary" onClick={(e) => this.close(e)}>Close</Button>
            </ToolbarItem>
          </ToolbarGroup>
          <ToolbarGroup>
            <ToolbarItem>
              <Button variant="link" onClick={(e) => this.goFullScreen(e)}>Full Screen</Button>
            </ToolbarItem>
          </ToolbarGroup>
        </Toolbar>
      </PageSection>
    );
  }
}