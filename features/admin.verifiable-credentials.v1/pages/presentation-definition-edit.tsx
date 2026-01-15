/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { AppConstants } from "@wso2is/admin.core.v1/constants/app-constants";
import { history } from "@wso2is/admin.core.v1/helpers/history";
import { AlertInterface, AlertLevels, IdentifiableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import { Field, Form } from "@wso2is/form";
import {
    CodeEditor,
    ContentLoader,
    DangerZone,
    DangerZoneGroup,
    EmphasizedSegment,
    PageLayout,
    PrimaryButton
} from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { Grid } from "semantic-ui-react";
import {
    createPresentationDefinition,
    deletePresentationDefinition,
    updatePresentationDefinition
} from "../api/presentation-definition";
import { useGetPresentationDefinition } from "../hooks/use-get-presentation-definition";
import { PresentationDefinitionInterface } from "../models/presentation-definition";

type PresentationDefinitionEditPageProps = IdentifiableComponentInterface;

/**
 * Presentation Definition Edit page.
 *
 * @param props - Props injected to the component.
 * @returns React element.
 */
const PresentationDefinitionEditPage: FunctionComponent<PresentationDefinitionEditPageProps> = ({
    "data-componentid": componentId = "presentation-definition-edit"
}: PresentationDefinitionEditPageProps): ReactElement => {
    const { t } = useTranslation();
    const dispatch: Dispatch = useDispatch();

    const [definitionId, setDefinitionId] = useState<string>(undefined);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [definitionJson, setDefinitionJson] = useState<string>("");

    const isNew: boolean = definitionId === "new";

    useEffect(() => {
        const path: string[] = history.location.pathname.split("/");
        const id: string = path[path.length - 1];

        setDefinitionId(id);
    }, []);

    const {
        data: definition,
        isLoading: isDefinitionLoading,
        error: prefixError,
        mutate: mutateDefinition
    } = useGetPresentationDefinition(definitionId, !isNew && !!definitionId);

    useEffect(() => {
        if (definition) {
            setDefinitionJson(definition.definitionJson);
        } else if (isNew) {
            setDefinitionJson(JSON.stringify({
                "input_descriptors": [
                    {
                        "id": "identity_credential",
                        "name": "Identity Credential",
                        "purpose": "Verify identity",
                        "constraints": {
                            "fields": [
                                {
                                    "path": [
                                        "$.type"
                                    ],
                                    "filter": {
                                        "type": "string",
                                        "pattern": "IdentityCredential"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }, null, 2));
        }
    }, [definition, isNew]);

    useEffect(() => {
        if (prefixError) {
            dispatch(addAlert<AlertInterface>({
                description: "Error retrieving presentation definition.",
                level: AlertLevels.ERROR,
                message: "Error Retrieving Data"
            }));
        }
    }, [prefixError]);

    const handleFormSubmit = (values: Map<string, any>): void => {
        const name: string = values.get("name").toString();
        const description: string = values.get("description")?.toString();

        let parsedJson: any;

        try {
            parsedJson = JSON.parse(definitionJson);
        } catch (e) {
            dispatch(addAlert<AlertInterface>({
                description: "Invalid JSON format in definition.",
                level: AlertLevels.ERROR,
                message: "Invalid JSON"
            }));

            return;
        }

        setIsSubmitting(true);

        const data: PresentationDefinitionInterface = {
            definitionId: !isNew ? definitionId : undefined,
            definitionJson: JSON.stringify(parsedJson), // Ensure minified or use formatting preference
            description,
            name
        };

        const apiCall: Promise<PresentationDefinitionInterface> = isNew
            ? createPresentationDefinition(data)
            : updatePresentationDefinition(definitionId, data);

        apiCall
            .then(() => {
                dispatch(addAlert<AlertInterface>({
                    description: isNew ? "Successfully created presentation definition." : "Successfully updated presentation definition.",
                    level: AlertLevels.SUCCESS,
                    message: isNew ? "Creation Successful" : "Update Successful"
                }));
                if (isNew) {
                    history.push(AppConstants.getPaths().get("PRESENTATION_DEFINITIONS"));
                } else {
                    mutateDefinition();
                }
            })
            .catch((error: any) => {
                dispatch(addAlert<AlertInterface>({
                    description: error?.response?.data?.description || "Error saving presentation definition.",
                    level: AlertLevels.ERROR,
                    message: "Error Saving Data"
                }));
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const handleDelete = (): void => {
        deletePresentationDefinition(definitionId)
            .then(() => {
                dispatch(addAlert<AlertInterface>({
                    description: "Successfully deleted presentation definition.",
                    level: AlertLevels.SUCCESS,
                    message: "Deletion Successful"
                }));
                history.push(AppConstants.getPaths().get("PRESENTATION_DEFINITIONS"));
            })
            .catch((error: any) => {
                dispatch(addAlert<AlertInterface>({
                    description: error?.response?.data?.description || "Error deleting presentation definition.",
                    level: AlertLevels.ERROR,
                    message: "Deletion Error"
                }));
            });
    };

    if (!isNew && (isDefinitionLoading || !definition)) {
        return <ContentLoader />;
    }

    return (
        <PageLayout
            pageTitle={isNew ? "New Presentation Definition" : definition?.name}
            title={isNew ? "New Presentation Definition" : definition?.name}
            backButton={{
                onClick: () => history.push(AppConstants.getPaths().get("PRESENTATION_DEFINITIONS")),
                text: "Go back to listing"
            }}
            bottomMargin={false}
            contentTopMargin={true}
            data-componentid={`${componentId}-page-layout`}
        >
            <EmphasizedSegment padded="very">
                <Form
                    id={`${componentId}-form`}
                    onSubmit={handleFormSubmit}
                    uncontrolledForm={true}
                    initialValues={{
                        description: definition?.description,
                        name: definition?.name
                    }}
                >
                    <Grid>
                        <Grid.Row columns={1}>
                            <Grid.Column mobile={16} tablet={16} computer={10}>
                                <Field.Input
                                    ariaLabel="name"
                                    inputType="text"
                                    name="name"
                                    label="Name"
                                    required={true}
                                    placeholder="Enter defined name"
                                    maxLength={100}
                                    minLength={3}
                                    validation={(value: string) => {
                                        if (!value) {
                                            return "Name is required";
                                        }
                                    }}
                                    data-componentid={`${componentId}-name`}
                                />
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row columns={1}>
                            <Grid.Column mobile={16} tablet={16} computer={10}>
                                <Field.Textarea
                                    ariaLabel="description"
                                    name="description"
                                    label="Description"
                                    required={false}
                                    placeholder="Enter description"
                                    maxLength={1000}
                                    minLength={0}
                                    data-componentid={`${componentId}-description`}
                                />
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row columns={1}>
                            <Grid.Column mobile={16} tablet={16} computer={16}>
                                <div className="field">
                                    <label>Definition JSON <span className="ui text-danger">*</span></label>
                                    <div style={{ border: "1px solid #ccc", height: "400px" }}>
                                        <CodeEditor
                                            lint
                                            language="json"
                                            sourceCode={definitionJson}
                                            options={{
                                                lineWrapping: true
                                            }}
                                            onChange={(editor: any, data: any, value: string) => {
                                                setDefinitionJson(value);
                                            }}
                                            theme={"light"}
                                        />
                                    </div>
                                </div>
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row columns={1}>
                            <Grid.Column mobile={16} tablet={16} computer={10}>
                                <PrimaryButton
                                    type="submit"
                                    loading={isSubmitting}
                                    data-componentid={`${componentId}-submit-button`}
                                >
                                    {isNew ? "Create" : "Update"}
                                </PrimaryButton>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Form>
            </EmphasizedSegment>
            {!isNew && (
                <DangerZoneGroup sectionHeader="Danger Zone">
                    <DangerZone
                        actionTitle="Delete Definition"
                        header="Delete Presentation Definition"
                        subheader="This action will delete the presentation definition permanently."
                        onActionClick={handleDelete}
                        data-componentid={`${componentId}-delete-danger-zone`}
                    />
                </DangerZoneGroup>
            )}
        </PageLayout>
    );
};

export default PresentationDefinitionEditPage;
