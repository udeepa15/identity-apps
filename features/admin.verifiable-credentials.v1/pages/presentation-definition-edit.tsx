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
import {
    ContentLoader,
    DangerZone,
    DangerZoneGroup,
    PageLayout
} from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import {
    createPresentationDefinition,
    deletePresentationDefinition,
    updatePresentationDefinition
} from "../api/presentation-definition";
import { PresentationDefinitionWizard } from "../components/presentation-definition-builder";
import { useGetPresentationDefinition } from "../hooks/use-get-presentation-definition";
import { PresentationDefinitionInterface } from "../models/presentation-definition";
import { mapDefinitionToFormData } from "../utils/form-mapper";

type PresentationDefinitionEditPageProps = IdentifiableComponentInterface;

/**
 * Presentation Definition Edit page with Builder mode.
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

    // Map definition to form data for Wizard
    const initialFormData = React.useMemo(() => {
        if (definition) {
            return mapDefinitionToFormData(definition);
        }
        return undefined;
    }, [definition]);

    useEffect(() => {
        if (prefixError) {
            dispatch(addAlert<AlertInterface>({
                description: "Error retrieving presentation definition.",
                level: AlertLevels.ERROR,
                message: "Error Retrieving Data"
            }));
        }
    }, [prefixError]);

    /**
     * Common submission logic.
     */
    const submitDefinition = useCallback((name: string, description: string, jsonString: string): void => {
        setIsSubmitting(true);

        let parsedJson: any;
        try {
            parsedJson = JSON.parse(jsonString);
        } catch {
            dispatch(addAlert<AlertInterface>({
                description: "Invalid JSON format.",
                level: AlertLevels.ERROR,
                message: "Invalid JSON"
            }));
            setIsSubmitting(false);
            return;
        }

        const data: PresentationDefinitionInterface = {
            definitionId: isNew ? parsedJson.id : definitionId,
            definitionJson: jsonString,
            description,
            name
        };

        const apiCall: Promise<PresentationDefinitionInterface> = isNew
            ? createPresentationDefinition(data)
            : updatePresentationDefinition(definitionId, data);

        apiCall
            .then(() => {
                dispatch(addAlert<AlertInterface>({
                    description: isNew
                        ? "Successfully created presentation definition."
                        : "Successfully updated presentation definition.",
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
    }, [isNew, definitionId, dispatch, mutateDefinition]);

    /**
     * Handles submission from builder wizard.
     */
    const handleWizardSubmit = useCallback((
        name: string,
        description: string,
        json: string,
        didMethod: string,
        signingAlgorithm: string
    ) => {
        try {
            const parsed = JSON.parse(json);
            // Inject internal configuration for DID method and algorithm
            parsed._internal = {
                did_method: didMethod,
                signing_algorithm: signingAlgorithm
            };
            submitDefinition(name, description, JSON.stringify(parsed, null, 2));
        } catch (e) {
            submitDefinition(name, description, json);
        }
    }, [submitDefinition]);

    /**
     * Handles delete.
     */
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

    /**
     * Handles cancel from wizard.
     */
    const handleWizardCancel = useCallback(() => {
        history.push(AppConstants.getPaths().get("PRESENTATION_DEFINITIONS"));
    }, []);

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
            <PresentationDefinitionWizard
                initialData={initialFormData}
                onCancel={handleWizardCancel}
                onSubmit={handleWizardSubmit}
                isSubmitting={isSubmitting}
                submitButtonText={isNew ? "Create Definition" : "Update Definition"}
                data-componentid={`${componentId}-wizard`}
            />

            {/* Danger Zone for existing definitions */}
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
