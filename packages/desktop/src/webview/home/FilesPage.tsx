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

import * as React from "react";
import {
  Alert,
  AlertVariant,
  Bullseye,
  Button,
  Card,
  CardBody,
  CardFooter,
  PageSection,
  Text,
  TextInput,
  Title,
  Gallery,
  CardHeader,
  Toolbar,
  TextContent,
  ToolbarGroup,
  ToolbarItem,
  InputGroup,
  Tooltip,
  TextVariants,
  Select,
  SelectOption,
  Form,
  FormGroup
} from "@patternfly/react-core";
import { useCallback, useEffect, useState } from "react";
import { useMemo } from "react";
import * as electron from "electron";
import { extractFileExtension, removeDirectories } from "../../common/utils";
import IpcRendererEvent = Electron.IpcRendererEvent;
import * as ReactDOM from "react-dom";
import { File, UNSAVED_FILE_NAME } from "../../common/File";
import { useContext } from "react";
import { GlobalContext } from "../common/GlobalContext";
import { SortAlphaDownIcon } from "@patternfly/react-icons";

enum InputFileUrlState {
  VALID,
  INITIAL,
  INVALID_URL,
  NO_FILE_URL,
  INVALID_EXTENSION
}

interface Props {
  openFile: (file: File) => void;
  openFileByPath: (filePath: string) => void;
}

export function FilesPage(props: Props) {
  const context = useContext(GlobalContext);
  const [lastOpenedFiles, setLastOpenedFiles] = useState<string[]>([]);
  const [filteredLastOpenedFiles, setFilteredLastOpenedFiles] = useState<string[]>([]);

  const ipc = useMemo(() => electron.ipcRenderer, [electron.ipcRenderer]);

  useEffect(() => {
    ipc.on("returnLastOpenedFiles", (event: IpcRendererEvent, data: { lastOpenedFiles: string[] }) => {
      setLastOpenedFiles(data.lastOpenedFiles);
      setFilteredLastOpenedFiles(applyFilter(data.lastOpenedFiles));
    });

    ipc.send("requestLastOpenedFiles");

    return () => {
      ipc.removeAllListeners("returnLastOpenedFiles");
    };
  }, [ipc]);

  const [url, setURL] = useState("");

  const showResponseError = useCallback((statusCode: number, description: string) => {
    ReactDOM.render(
      <div className={"kogito--alert-container"}>
        <Alert variant={AlertVariant.danger} title="An error happened while fetching your file">
          <br />
          <b>Error details: </b>
          {statusCode}
          {statusCode && description && " - "}
          {description}
        </Alert>
      </div>,
      document.getElementById("app")!
    );
  }, []);

  const showFetchError = useCallback((description: string) => {
    ReactDOM.render(
      <div className={"kogito--alert-container"}>
        <Alert variant={AlertVariant.danger} title="An unexpected error happened while trying to fetch your file">
          <br />
          <b>Error details: </b>
          {description}
          <br />
          <br />
          <b>Possible cause: </b>
          The URL to your file must allow CORS in its response, which should contain the following header:
          <br />
          <pre>Access-Control-Allow-Origin: *</pre>
        </Alert>
      </div>,
      document.getElementById("app")!
    );
  }, []);

  const [typeFilterSelect, setTypeFilterSelect] = useState({ isExpanded: false, value: "All" });
  const [searchFilter, setSearchFilter] = useState("");
  const [sortAlphaFilter, setSortAlphaFilter] = useState(false);

  const typeFilterOptions = useMemo(() => [{ value: "All" }, { value: "BPMN" }, { value: "DMN" }], []);

  const onSelectTypeFilter = useCallback((event, selection) => {
    setTypeFilterSelect({
      isExpanded: false,
      value: selection
    });
  }, []);

  const onToggleTypeFilter = useCallback(
    isExpanded => {
      setTypeFilterSelect({
        isExpanded: isExpanded,
        value: typeFilterSelect.value
      });
      setFilteredLastOpenedFiles(applyFilter(lastOpenedFiles));
    },
    [typeFilterSelect, lastOpenedFiles]
  );

  const onChangeSearchFilter = useCallback(
    newValue => {
      setSearchFilter(newValue);
      setFilteredLastOpenedFiles(applyFilter(lastOpenedFiles));
    },
    [lastOpenedFiles]
  );

  const applyFilter = useCallback(
    (files: string[]) => {
      const filteredFiles = files
        .filter(file =>
          removeDirectories(file)
            ?.toUpperCase()
            .includes(searchFilter.toUpperCase())
        )
        .filter(
          file => typeFilterSelect.value === "All" || file.toUpperCase().endsWith(typeFilterSelect.value.toUpperCase())
        );

      if (sortAlphaFilter) {
        return filteredFiles.sort((file1, file2) => {
          const f1 = file1.toLowerCase();
          const f2 = file2.toLowerCase();

          if (f1 < f2) {
            return -1;
          } else if (f1 > f2) {
            return 1;
          }

          return 0;
        });
      }

      return filteredFiles;
    },
    [searchFilter, typeFilterSelect, sortAlphaFilter]
  );

  const [inputFileUrlState, setInputFileUrlState] = useState(InputFileUrlState.INITIAL);

  const validateFileInput = useCallback((fileUrl: string) => {
    let urlObject: URL;
    try {
      urlObject = new URL(fileUrl);
    } catch (e) {
      setInputFileUrlState(InputFileUrlState.INVALID_URL);
      return;
    }
    const fileType = extractFileExtension(urlObject.pathname);
    if (!fileType) {
      setInputFileUrlState(InputFileUrlState.NO_FILE_URL);
    } else if (!context.router.getLanguageData(fileType)) {
      setInputFileUrlState(InputFileUrlState.INVALID_EXTENSION);
    } else {
      setInputFileUrlState(InputFileUrlState.VALID);
    }
  }, []);

  const inputFileChanged = useCallback((fileUrl: string) => {
    setURL(fileUrl);
    validateFileInput(fileUrl);
  }, []);

  const validatedInputUrl = useMemo(
      () => inputFileUrlState === InputFileUrlState.VALID || inputFileUrlState === InputFileUrlState.INITIAL,
      [inputFileUrlState]
  );

  const importFileByUrl = useCallback(() => {
    if (validatedInputUrl && inputFileUrlState !== InputFileUrlState.INITIAL) {
      fetch(url)
          .then(response => {
            if (response.ok) {
              response.text().then(content => {
                const file = {
                  filePath: UNSAVED_FILE_NAME,
                  fileType: extractFileExtension(url)!,
                  fileContent: content
                };

                ipc.send("enableFileMenus");
                props.openFile(file);
              });
            } else {
              showResponseError(response.status, response.statusText);
            }
          })
          .catch(error => {
            showFetchError(error.toString());
          });
    }
  }, [validatedInputUrl, inputFileUrlState, url, props.openFile, showResponseError, showFetchError]);

  const importFileByUrlFormSubmit = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      importFileByUrl();
    },
    [url]
  );

  const messageForStateInputUrl = useMemo(() => {
    switch (inputFileUrlState) {
      case InputFileUrlState.INITIAL:
        return "http://";
      case InputFileUrlState.INVALID_EXTENSION:
        return "File type is not supported";
      case InputFileUrlState.INVALID_URL:
        return "Enter a valid URL";
      case InputFileUrlState.NO_FILE_URL:
        return "File URL is not valid";
      default:
        return "";
    }
  }, [inputFileUrlState]);

  const onInputFileUrlBlur = useCallback(() => {
    if (url.trim() === "") {
      setInputFileUrlState(InputFileUrlState.INITIAL);
    }
  }, [url]);

  return (
    <>
      <PageSection>
        <TextContent>
          <Title size={"2xl"} headingLevel={"h2"}>
            {"Create new file"}
          </Title>
        </TextContent>
        <Gallery gutter="md" className="kogito--desktop__actions-gallery">
          <Card
            className={"kogito--desktop__actions-card"}
            component={"article"}
            isHoverable={false}
            isCompact={true}
            onClick={() => context.fileActions.createNewFile("bpmn")}
          >
            <CardHeader>
              {
                <Title size={"xl"} headingLevel={"h3"} className="pf-u-mb-md">
                  {"Blank Workflow (.BPMN)"}
                </Title>
              }
            </CardHeader>
            <CardBody component={"div"} isFilled={true} className="kogito--desktop__actions-card-body">
              {<img src={"images/file_icon_regular.svg"} alt="file icon" className="kogito--desktop__actions-img" />}
            </CardBody>
          </Card>
          <Card
            className={"kogito--desktop__actions-card"}
            component={"article"}
            isHoverable={false}
            isCompact={true}
            onClick={() => context.fileActions.createNewFile("dmn")}
          >
            <CardHeader>
              {
                <Title size={"xl"} headingLevel={"h3"} className="pf-u-mb-md">
                  {"Blank Decision Model (.DMN)"}
                </Title>
              }
            </CardHeader>
            <CardBody component={"div"} isFilled={true} className="kogito--desktop__actions-card-body">
              {<img src={"images/file_icon_regular.svg"} alt="file icon" className="kogito--desktop__actions-img" />}
            </CardBody>
          </Card>
          <Card
            className={"kogito--desktop__actions-card"}
            component={"article"}
            isHoverable={false}
            isCompact={true}
            onClick={() => context.fileActions.openSample("bpmn")}
          >
            <CardHeader>
              {
                <Title size={"xl"} headingLevel={"h3"} className="pf-u-mb-md">
                  {"Sample Workflow (.BPMN)"}
                </Title>
              }
            </CardHeader>
            <CardBody component={"div"} isFilled={true} className="kogito--desktop__actions-card-body">
              {
                <img
                  src={"images/sample_file_icon_regular.svg"}
                  alt="file icon"
                  className="kogito--desktop__actions-img"
                />
              }
            </CardBody>
          </Card>
          <Card
            className={"kogito--desktop__actions-card"}
            component={"article"}
            isHoverable={false}
            isCompact={true}
            onClick={() => context.fileActions.openSample("dmn")}
          >
            <CardHeader>
              {
                <Title size={"xl"} headingLevel={"h3"} className="pf-u-mb-md">
                  {"Sample Decision Model (.DMN)"}
                </Title>
              }
            </CardHeader>
            <CardBody component={"div"} isFilled={true} className="kogito--desktop__actions-card-body">
              {
                <img
                  src={"images/sample_file_icon_regular.svg"}
                  alt="file icon"
                  className="kogito--desktop__actions-img"
                />
              }
            </CardBody>
          </Card>
          <Card className="kogito--desktop__actions-card--wide">
            <CardHeader>
              <Title size={"xl"} headingLevel={"h3"}>
                Open from source
              </Title>
            </CardHeader>
            <CardBody>
              <TextContent>
                <Text component={TextVariants.p}>Paste a URL to a source code link (GitHub, Dropbox, etc.)</Text>
                <Form onSubmit={importFileByUrlFormSubmit} disabled={!validatedInputUrl}>
                  <FormGroup
                    label="URL"
                    fieldId="url-text-input"
                    isValid={validatedInputUrl}
                    helperText=""
                    helperTextInvalid={messageForStateInputUrl}
                  >
                    <TextInput
                      isRequired={true}
                      onBlur={onInputFileUrlBlur}
                      isValid={validatedInputUrl}
                      value={url}
                      onChange={inputFileChanged}
                      type="url"
                      id="url-text-input"
                      name="urlText"
                      aria-describedby="url-text-input-helper"
                      placeholder="URL"
                    />
                  </FormGroup>
                </Form>
              </TextContent>
            </CardBody>
            <CardFooter>
              <Button variant="secondary" onClick={importFileByUrl}>
                Open from source
              </Button>
            </CardFooter>
          </Card>
        </Gallery>
      </PageSection>
      <PageSection variant="light">
        <Title size={"2xl"} headingLevel={"h3"}>
          Recent Files
        </Title>
        <Toolbar>
          {
            <>
              <ToolbarGroup>
                {
                  <Select
                    onSelect={onSelectTypeFilter}
                    onToggle={onToggleTypeFilter}
                    isExpanded={typeFilterSelect.isExpanded}
                    selections={typeFilterSelect.value}
                    width={"7em"}
                  >
                    {typeFilterOptions.map((option, index) => (
                      <SelectOption key={index} value={option.value} />
                    ))}
                  </Select>
                }
              </ToolbarGroup>
              <ToolbarGroup>
                <InputGroup>
                  <TextInput
                    name={"searchInput"}
                    id={"searchInput"}
                    type={"search"}
                    aria-label={"search input example"}
                    placeholder={"Search"}
                    onChange={onChangeSearchFilter}
                  />
                </InputGroup>
              </ToolbarGroup>
              <ToolbarItem>
                <Button
                  variant="plain"
                  aria-label="sort file view"
                  className={sortAlphaFilter ? "kogito--filter-btn-pressed" : "kogito--filter-btn"}
                  onClick={() => setSortAlphaFilter(!sortAlphaFilter)}
                >
                  <SortAlphaDownIcon />
                </Button>
              </ToolbarItem>
              {/* TODO: Implement grid view */}
              {/*<ToolbarGroup className="pf-u-ml-auto">
                <ToolbarItem>
                  <Button variant="plain" aria-label="tiled file view">
                    <ThIcon />
                  </Button>
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="plain" aria-label="list file view">
                    <ThListIcon />
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>*/}
            </>
          }
        </Toolbar>
      </PageSection>
      <PageSection isFilled={true}>
        {filteredLastOpenedFiles.length === 0 && <Bullseye>No files were opened yet.</Bullseye>}

        {filteredLastOpenedFiles.length > 0 && (
          <Gallery gutter="lg" className="kogito-desktop__file-gallery">
            {filteredLastOpenedFiles.map(filePath => (
              <Card
                key={filePath}
                isCompact={true}
                onClick={() => props.openFileByPath(filePath)}
                className={"kogito--desktop__files-card"}
              >
                <CardBody>
                  <Bullseye>
                    <img
                      title={filePath}
                      src={"images/" + extractFileExtension(filePath) + "_thumbnail.png"}
                      className="kogito--desktop__file-img"
                    />
                  </Bullseye>
                </CardBody>
                <CardFooter>
                  <Tooltip content={<div>{filePath}</div>}>
                    <Title headingLevel="h3" size="xs" className="kogito--desktop__filename">
                      {removeDirectories(filePath)}
                    </Title>
                  </Tooltip>
                </CardFooter>
              </Card>
            ))}
          </Gallery>
        )}
      </PageSection>
    </>
  );
}
